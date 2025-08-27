// ScreenRatioDropdown.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useGetRatio } from "../../ReactQuery/Ratio/GetRatio";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { setSelectedRatio } from "../../Redux/ScreenManagement/ScreenManagementSlice";

type Props = {
  allowNone?: boolean;
  noneLabel?: string;
};

const CUSTOM = "__custom__";
const NONE = "__none__";
// zod schema
const schema = z.object({
  num: z.coerce.number().int().positive(),
  den: z.coerce.number().int().positive(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const gcd = (a: number, b: number) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

const ScreenRatioDropdown: React.FC<Props> = ({
  allowNone = false,
  noneLabel = "None",
}) => {
  const { data: ratios = [], isLoading, isError } = useGetRatio();
  const dispatch = useDispatch();

  const selectedIdFromStore = useSelector(
    (s: RootState) => s.screenManagement.selectedRatioId
  );

  const [mode, setMode] = useState<"preset" | "custom">("preset");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormInput, any, FormOutput>({ resolver: zodResolver(schema) });

  // Initialize with first ratio id if nothing selected
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
  // Handle preset/custom selection
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
    dispatch(
      setSelectedRatio({
        id: v,
        name: selectedOption ? selectedOption.ratio : null,
      })
    );
  };
  // Submit custom ratio
  // inside onAddCustom
  const onAddCustom = handleSubmit(({ num, den }) => {
    const g = gcd(num, den);
    const ratio = `${num / g}:${den / g}`;
    const customId = `custom-${ratio.replace(":", "x")}`;
    dispatch(setSelectedRatio({ id: customId, name: ratio }));
  });

  // Preview
  const nRaw = watch("num");
  const dRaw = watch("den");
  const n = Number(nRaw);
  const d = Number(dRaw);
  const preview =
    Number.isFinite(n) && Number.isFinite(d) && n > 0 && d > 0
      ? `${n / gcd(n, d)}:${d / gcd(n, d)}`
      : "";

  return (
    <div className="space-y-2">
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
            ratios.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.ratio}
              </option>
            ))}
          {allowNone && <option value={NONE}>{noneLabel}</option>}
          <option value={CUSTOM}>Custom…</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
      </div>

      {mode === "custom" && (
        <form
          onSubmit={onAddCustom}
          className="rounded-lg border border-neutral-200 p-3"
        >
          <label className="mb-2 block text-xs font-semibold text-neutral-700">
            Add Custom Ratio
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="16"
              {...register("num")}
              className="w-1/2 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
            <span className="text-neutral-500">:</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="9"
              {...register("den")}
              className="w-1/2 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          {(errors.num || errors.den) && (
            <p className="mt-2 text-xs text-red-600">
              Enter positive integers in both fields.
            </p>
          )}
          {!errors.num && !errors.den && preview && (
            <p className="mt-2 text-xs text-neutral-600">
              Will be saved as <span className="font-medium">{preview}</span>.
            </p>
          )}

          <button
            type="submit"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            <Plus size={16} /> Add
          </button>
        </form>
      )}
    </div>
  );
};

export default ScreenRatioDropdown;
