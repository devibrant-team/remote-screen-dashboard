// Components/Models/AddGroupModal.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RootState } from "../../../store";
import { setGroupName } from "../../Redux/AddGroup/AddGroupSlice";
import ScreenRatioDropdown from "../Dropdown/ScreenRatioDropdown";
import BranchDropdown from "../Dropdown/BranchDropdown";
import { useGetScreen } from "../../ReactQuery/Screen/GetScreen";
import { useAddGroup } from "../../ReactQuery/Group/useAddGroup";
import type { AddGroupPayload } from "../../ReactQuery/Group/PostGroup";
import { ChevronDown, ChevronUp } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters"),
  ratioId: z.coerce.number().int().positive("Please select a ratio"),
  branchId: z.coerce.number().int().positive("Please select a branch"),
  screenIds: z.array(z.coerce.number().int()).min(2, "Select at least 2 screens"),
});
type FormValues = z.infer<typeof schema>;

// Fix resolver typing mismatch across versions
const resolver = zodResolver(schema) as Resolver<FormValues, any, FormValues>;

type Props = { onClose?: () => void };

const AddGroupModal = ({ onClose }: Props) => {
  const dispatch = useDispatch();

  // Show list in chunks of 5
  const [visible, setVisible] = useState(5);

  // Filtering: allow "Any" without editing the dropdown component
  const [anyRatio, setAnyRatio] = useState(false);

  const { data: screens, isLoading: screensLoading } = useGetScreen();

  // From Redux (dropdowns)
  const selectedRatioId = useSelector(
    (s: RootState) => s.screenManagement.selectedScreenRatioId
  );
  const selectedBranchId = useSelector(
    (s: RootState) => s.screenManagement.selectedBranchId
  );

  // Optional: ratio options in store (id → label)
  const ratioOptions =
    useSelector((s: RootState) => (s as any).screenManagement?.ratioOptions) as
      | Array<{ id: number; label?: string; name?: string; value?: string }>
      | undefined;

  const { mutate: addGroup, isPending } = useAddGroup();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid },
    watch,
    reset,
  } = useForm<FormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {} as Partial<FormValues>,
  });

  // Keep form in sync with Redux dropdowns (ratio/branch)
  useEffect(() => {
    if (selectedRatioId != null) {
      setValue("ratioId", Number(selectedRatioId), { shouldValidate: true });
    }
  }, [selectedRatioId, setValue]);

  useEffect(() => {
    if (selectedBranchId != null) {
      setValue("branchId", Number(selectedBranchId), { shouldValidate: true });
    }
  }, [selectedBranchId, setValue]);

  // ------- Filtering helpers -------
  const ratioIdFromForm = watch("ratioId"); // number | undefined

  // Prefer the form's ratioId (reflects latest dropdown selection),
  // unless "Any" is toggled for filtering.
  const effectiveRatioIdForFilter =
    anyRatio ? null : (ratioIdFromForm ?? selectedRatioId ?? null);

  const getRatioLabelById = (id?: number | null): string | null => {
    if (!id || !ratioOptions) return null;
    const opt = ratioOptions.find((o) => o.id === id);
    // try common label keys
    return (opt?.label ?? (opt as any)?.name ?? (opt as any)?.value ?? null) as
      | string
      | null;
  };
  const norm = (x?: string | null) => (x ?? "").replace(/\s+/g, "").toLowerCase();

  const filteredScreens = (screens ?? []).filter((sc: any) => {
    // Any → no filter
    if (effectiveRatioIdForFilter === null) return true;

    // If screen has numeric ratioId, match by id
    if (sc.ratioId != null && typeof sc.ratioId !== "undefined") {
      return Number(sc.ratioId) === Number(effectiveRatioIdForFilter);
    }

    // Else try to match by text label against sc.ratio (e.g., "16:9")
    const label = getRatioLabelById(
      typeof effectiveRatioIdForFilter === "number"
        ? effectiveRatioIdForFilter
        : null
    );
    if (label) {
      return norm(sc.ratio) === norm(label);
    }

    // Fallback: if we can't resolve label, don't filter out
    return true;
  });

  const totalScreens = filteredScreens.length;
  const visibleScreens = filteredScreens.slice(0, visible);

  // Reset visible chunk when filter changes
  useEffect(() => {
    setVisible(5);
  }, [anyRatio, ratioIdFromForm, selectedRatioId, totalScreens]);

  // ------- Submit -------
  const onSubmit = (values: FormValues) => {
    const payload: AddGroupPayload = {
      name: values.name.trim(),
      ratioId: values.ratioId, // number
      branchId: values.branchId, // number
      assignScreens: values.screenIds.map((id) => ({ id })), // [{id}]
    };

    addGroup(payload, {
      onSuccess: () => {
        reset();
        onClose?.();
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.errors?.branchId?.[0] ??
          err?.response?.data?.errors?.ratioId?.[0] ??
          err?.response?.data?.message;
        if (msg?.toLowerCase().includes("branch")) {
          setError("branchId", { type: "server", message: msg });
        } else if (msg?.toLowerCase().includes("ratio")) {
          setError("ratioId", { type: "server", message: msg });
        }
      },
    });
  };

  const selectedIds = watch("screenIds");

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      {/* Header */}
      <div className="mb-4">
        <p className="mt-1 text-sm text-neutral-600">
          Name your group and configure its display ratio, branch, and assigned
          screens.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Group Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="group-name"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              id="group-name"
              placeholder="e.g., Front Window TV"
              {...register("name", {
                onChange: (e) => dispatch(setGroupName(e.target.value)),
              })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">
                Give this group a short, recognizable name.
              </p>
            )}
          </div>

          {/* Ratio */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Group Ratio <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <ScreenRatioDropdown />
              {/* Toggle a local "Any" filter without changing the dropdown itself */}
              <button
                type="button"
                className={`rounded-md border px-2 py-1 text-xs ${
                  anyRatio
                    ? "border-neutral-300 bg-neutral-800 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
                onClick={() => setAnyRatio((v) => !v)}
                title="Filter screens by any ratio"
              >
                {anyRatio ? "Any (on)" : "Any"}
              </button>
            </div>
            {/* Hidden field to keep RHF value in the form model (ratioId stays a number) */}
            <input type="hidden" {...register("ratioId", { valueAsNumber: true })} />
            {errors.ratioId && (
              <p className="mt-1 text-xs text-red-600">{errors.ratioId.message}</p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Branch <span className="text-red-500">*</span>
            </label>
            <BranchDropdown />
            {/* Hidden field mirrors Redux → RHF */}
            <input type="hidden" {...register("branchId", { valueAsNumber: true })} />
            {errors.branchId && (
              <p className="mt-1 text-xs text-red-600">{errors.branchId.message}</p>
            )}
          </div>

          {/* Assign Screens (checkboxes) — 5 by 5 with controls */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Assign Screens <span className="text-red-500">*</span>
            </label>

            <div className="rounded-lg border border-neutral-200 p-3">
              {screensLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="h-5 w-2/3 animate-pulse rounded bg-neutral-200"
                    />
                  ))}
                </div>
              ) : totalScreens === 0 ? (
                <p className="text-sm text-neutral-500">No screens available.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {visibleScreens.map((sc) => (
                      <li key={sc.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 hover:bg-neutral-50">
                          <input
                            type="checkbox"
                            value={sc.id}
                            {...register("screenIds")}
                            className="h-4 w-4 accent-red-500"
                          />
                          <span className="text-sm text-neutral-800">
                            {sc.name || `Screen #${sc.id}`}
                          </span>
                          <span className="ml-auto text-xs text-neutral-500">
                            {(sc as any).branch ?? "No branch"} • {(sc as any).ratio ?? "—"}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      Showing {Math.min(visible, totalScreens)} of {totalScreens}
                    </p>
                    <div className="flex items-center gap-2">
                      {visible > 5 && (
                        <button
                          type="button"
                          onClick={() => setVisible((v) => Math.max(5, v - 5))}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                          title="Show less"
                        >
                          <ChevronUp size={14} />
                          Show less
                        </button>
                      )}
                      {visible < totalScreens && (
                        <button
                          type="button"
                          onClick={() =>
                            setVisible((v) => Math.min(totalScreens, v + 5))
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                          title="Show 5 more"
                        >
                          <ChevronDown size={14} />
                          Show 5 more
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Selected: {selectedIds?.length ?? 0}
              </p>
              {errors.screenIds && (
                <p className="text-xs text-red-600">
                  {errors.screenIds.message as string}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting || isPending}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

export default AddGroupModal;
