// ScreenRatioDropdown.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, CheckCircle2, X , } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useGetRatio, RATIO_QK } from "../../ReactQuery/Ratio/GetRatio";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { setSelectedRatio } from "../../Redux/ScreenManagement/ScreenManagementSlice";
import { useInsertRatio } from "../../ReactQuery/Ratio/PostRatio";
import { useQueryClient } from "@tanstack/react-query";

type Props = { allowNone?: boolean; noneLabel?: string };

const CUSTOM = "__custom__";
const NONE = "__none__";

/** Make width/height accept empty string → undefined, otherwise positive int */
// Accept "" | null | undefined as "not provided", otherwise require positive int
const asOptionalInt = (label: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z
      .number()                  // ← no options object here
      .int(`${label} must be an integer`)
      .positive(`${label} must be > 0`)
      .optional()
  );

// Validation: width & height are a pair (both empty or both provided)
const schema = z
  .object({
    num: z.coerce.number().int().positive(),
    den: z.coerce.number().int().positive(),
    width: asOptionalInt("Width"),
    height: asOptionalInt("Height"),
  })
  .superRefine(({ width, height }, ctx) => {
    const wProvided = width !== undefined;
    const hProvided = height !== undefined;
    if (wProvided && !hProvided) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Height is required when width is provided.",
        path: ["height"],
      });
    }
    if (hProvided && !wProvided) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Width is required when height is provided.",
        path: ["width"],
      });
    }
  });

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const ScreenRatioDropdown: React.FC<Props> = ({
  allowNone = false,
  noneLabel = "None",
}) => {
  const { data: ratios = [], isLoading, isError } = useGetRatio();
  const dispatch = useDispatch();
  const qc = useQueryClient();

  const selectedIdFromStore = useSelector(
    (s: RootState) => s.screenManagement.selectedRatioId
  );

  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormInput, any, FormOutput>({ resolver: zodResolver(schema) });

  // Keep all post-success behavior here via mutation options
  const { mutate, isPending: isSavingRatio } = useInsertRatio({
    onSuccess: async (created) => {
      // Show success UI
      setSuccessMsg(`Ratio “${created.ratio}” added successfully`);

      // Force refresh so dropdown has the new value
      await qc.invalidateQueries({ queryKey: RATIO_QK, exact: true });
      const refreshed = await qc.fetchQuery({ queryKey: RATIO_QK });

      // Try to select by exact ratio string first
      const list = (refreshed as any[]) ?? [];
      const found = list.find((r) => String(r.ratio) === created.ratio);

      if (found) {
        dispatch(setSelectedRatio({ id: found.id, name: found.ratio }));
      } else {
        // fallback to returned id/name
        dispatch(setSelectedRatio({ id: created.id, name: created.ratio }));
      }

      // Reset custom UI back to dropdown
      setMode("preset");
      reset({ num: undefined as any, den: undefined as any, width: undefined, height: undefined });
    },
    onError: (err) => {
      console.error("[ScreenRatioDropdown] create failed:", err);
    },
  });

  // Auto-dismiss success banner
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 1000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // Default-select first ratio if none is chosen (and "none" not allowed)
  useEffect(() => {
    if (!allowNone && !selectedIdFromStore && ratios.length) {
      dispatch(setSelectedRatio({ id: ratios[0].id, name: ratios[0].ratio }));
    }
  }, [allowNone, selectedIdFromStore, ratios, dispatch]);

  const selectedId = useMemo(() => {
    if (mode === "custom") return CUSTOM;
    if (allowNone && selectedIdFromStore == null) return NONE;
    return selectedIdFromStore ? String(selectedIdFromStore) : "";
  }, [mode, allowNone, selectedIdFromStore]);

  const onChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === CUSTOM) {
      setMode("custom");
      return;
    }
    setMode("preset");
    if (allowNone && v === NONE) {
      dispatch(setSelectedRatio({ id: null, name: null }));
      return;
    }
    const selectedOption = ratios.find((r) => String(r.id) === v);
    dispatch(setSelectedRatio({ id: v, name: selectedOption?.ratio ?? null }));
  };

  // Keep user's exact numbers; no simplification
  const onAddCustom = handleSubmit(({ num, den, width, height }) => {
    const ratio = `${num}:${den}`;
    mutate({
      ratio,
      num,
      den,
      width: width === undefined ? undefined : width,
      height: height === undefined ? undefined : height,
    });
  });

  return (
    <div className="space-y-3">
      {/* success banner */}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
          <div className="flex-1 text-sm text-green-700">{successMsg}</div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="rounded p-1 text-green-700 hover:bg-green-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preset dropdown */}
      <div className="relative w-full">
        <select
          value={selectedId}
          onChange={onChangeSelect}
          disabled={(isLoading || isError) && ratios.length === 0}
          className="w-full appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 disabled:opacity-50"
        >
          {isLoading && <option>Loading...</option>}
          {isError && ratios.length === 0 && <option>Failed to load</option>}
          {!isLoading &&
            ratios.map((r) => {
              const showDims =
                r.width != null && r.height != null; // both must be present
              const label = showDims ? `${r.ratio} (${r.width}x${r.height})` : r.ratio;
              return (
                <option key={r.id} value={String(r.id)}>
                  {label}
                </option>
              );
            })}
          {allowNone && <option value={NONE}>{noneLabel}</option>}
          <option value={CUSTOM}>Custom…</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
      </div>

      {/* Custom full view */}
      {mode === "custom" && (
        // not using <form> to avoid modal auto-close
        <div className="rounded-lg border border-neutral-200 p-4 space-y-3 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-2">
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="Width ratio (e.g., 16)"
              {...register("num")}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
            />
            {errors.num && (
              <p className="text-xs text-red-600">{errors.num.message as string}</p>
            )}

            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="Height ratio (e.g., 9)"
              {...register("den")}
             className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
            />
            {errors.den && (
              <p className="text-xs text-red-600">{errors.den.message as string}</p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="button"
              disabled={isSavingRatio}
              onClick={() => onAddCustom()}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-60"
            >
              <Plus size={16} /> {isSavingRatio ? "Saving…" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenRatioDropdown;
