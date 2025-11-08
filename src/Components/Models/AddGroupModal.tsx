// Components/Models/AddGroupModal.tsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, type Resolver, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { X, ChevronDown, ChevronUp, Plus } from "lucide-react";

import type { RootState } from "../../../store";

import { setGroupName } from "../../Redux/AddGroup/AddGroupSlice";
import ScreenRatioDropdown from "../Dropdown/ScreenRatioDropdown";
import BranchDropdown from "../Dropdown/BranchDropdown";
import AddBranchModal from "../../Screens/ScreenManagement/AddBranchModal";

import { useAddGroup } from "../../ReactQuery/Group/useAddGroup";
import type { AddGroupPayload } from "../../ReactQuery/Group/PostGroup";

import DefaultPlaylistDropdown from "../../Screens/ScreenManagement/DefaultPlaylistModal";
import {
  selectedDefaultPlaylistId,
  setDefaultPlaylist,
} from "../../Redux/ScreenManagement/ScreenManagementSlice";
import { selectSelectedGroup } from "../../Redux/ScreenManagement/GroupSlice";
import type { UpdateGroupPayload } from "../../ReactQuery/Group/UpdateGroup";
import { useUpdateGroup } from "../../ReactQuery/Group/useUpdateGroup";
import {
  useGetGroupScreens,
  GROUP_SCREENS_QK,
} from "../../ReactQuery/Group/GetGroupScreen";
import ErrorToast from "../ErrorToast";

const toNullableNumber = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}, z.number().int().positive().nullable());

const schema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters"),
  ratioId: toNullableNumber,
  branchId: z.coerce.number().int().positive("Please select a branch"),
  // no min here – "at least 2 screens" is enforced only in Add mode
  screenIds: z.array(z.coerce.number().int()),
});
type FormValues = z.infer<typeof schema>;
const resolver = zodResolver(schema) as Resolver<FormValues, any, FormValues>;

type Props = {
  open: boolean;
  onClose: () => void;
  isEdit?: boolean;
  editingGroup?: any | null;
};

const AddGroupModal = ({ open, onClose, isEdit = false }: Props) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const selectedGroup = useSelector(selectSelectedGroup);
  const [uiError, setUiError] = useState<unknown | null>(null);
  const [visible, setVisible] = useState(15);
  const [screensLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const selectedPlaylistId = useSelector(selectedDefaultPlaylistId);

  // Screens from slice
  const screensFromSlice = useSelector((s: RootState) => s.screens.items);

  const selectedRatioId = useSelector(
    (s: RootState) => s.screenManagement.selectedRatioId
  );
  const selectedRatioName = useSelector(
    (s: RootState) => s.screenManagement.selectedRatioName
  );
  const selectedBranchId = useSelector(
    (s: RootState) => s.screenManagement.selectedBranchId
  );

  const { mutate: addGroup, isPending: isAddPending } = useAddGroup();
  const { mutate: updateGroup, isPending: isUpdatePending } = useUpdateGroup();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid },
    watch,
    reset,
    control,
  } = useForm<FormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      name: "",
      ratioId: null,
      branchId: undefined as any,
      screenIds: [],
    } as Partial<FormValues>,
  });

  // Screens already assigned to this group (API)
  const { data: groupScreens } = useGetGroupScreens(
    isEdit && selectedGroup ? Number(selectedGroup.id) : null
  );

  // ✅ Build "group-first" merged array
  const mergedScreens = useMemo(() => {
    const normalizedGroupScreens =
      (groupScreens ?? []).map((gs: any) => {
        const backendId = Number(gs.id);
        return {
          id: backendId,
          screenId: backendId,
          name: gs.name,
          branch: gs.branchName,
          ratio: gs.ratio,
        };
      }) ?? [];

    const groupIds = new Set(
      normalizedGroupScreens.map((gs: any) => Number(gs.screenId))
    );

    const normalizedSliceScreens = (screensFromSlice ?? [])
      .map((sc: any) => {
        const backendId = Number(sc.screenId ?? sc.id);
        if (!backendId) return null;
        return {
          id: backendId,
          screenId: backendId,
          name: sc.name,
          branch: sc.branch ?? sc.branchName ?? null,
          ratio: sc.ratio ?? null,
        };
      })
      .filter(Boolean) as any[];

    // Only add slice screens that are NOT already in the group
    const sliceOnly = normalizedSliceScreens.filter(
      (sc: any) => !groupIds.has(Number(sc.screenId))
    );

    // Group screens FIRST, then the rest
    return [...normalizedGroupScreens, ...sliceOnly];
  }, [screensFromSlice, groupScreens]);

  // Prefill name + playlist when editing
  useEffect(() => {
    if (isEdit && selectedGroup) {
      reset((prev) => ({
        ...prev,
        name: selectedGroup.name || "",
      }));

      if (selectedGroup.name) {
        dispatch(setGroupName(selectedGroup.name));
      }

      if (selectedGroup.defaultPlaylistId) {
        dispatch(setDefaultPlaylist(selectedGroup.defaultPlaylistId));
      }
    }
  }, [isEdit, selectedGroup, reset, dispatch]);

  // ✅ Preselect screens from the group (checked by default)
  useEffect(() => {
    if (!isEdit || !groupScreens) return;

    const apiIds = groupScreens.map((sc: any) => Number(sc.id));
    setValue("screenIds", apiIds, { shouldValidate: true });
  }, [isEdit, groupScreens, setValue]);

  // Clear when switching back to Add mode
  useEffect(() => {
    if (!isEdit && !selectedGroup) {
      reset({
        name: "",
        ratioId: null,
        branchId: undefined as any,
        screenIds: [],
      });
      dispatch(setGroupName(""));
    }
  }, [isEdit, selectedGroup, reset, dispatch]);

  // Keep form in sync with ratio / branch from Redux
  useEffect(() => {
    setValue("ratioId", selectedRatioId ? Number(selectedRatioId) : null, {
      shouldValidate: true,
    });
  }, [selectedRatioId, setValue]);

  useEffect(() => {
    if (selectedBranchId != null) {
      setValue("branchId", Number(selectedBranchId), { shouldValidate: true });
    }
  }, [selectedBranchId, setValue]);

  // Filtering screens by selected ratio (on merged list)
  const norm = (s?: string | null) =>
    (s ?? "").trim().replace(/\s+/g, "").toLowerCase();

  const allScreens = mergedScreens ?? [];
  const shouldFilterByRatio =
    selectedRatioId != null && !!selectedRatioName?.trim();

  const filteredScreens = shouldFilterByRatio
    ? allScreens.filter((sc: any) => norm(sc.ratio) === norm(selectedRatioName))
    : allScreens;

  const totalScreens = filteredScreens.length;
  const visibleScreens = filteredScreens.slice(0, visible);

  // Reset visible when list or filter changes
  useEffect(() => {
    setVisible(15);
  }, [totalScreens, selectedRatioName, selectedRatioId, shouldFilterByRatio]);

  const selectedIds = watch("screenIds") as number[] | undefined;

  // ⛔ central close handler – resets form + clears query cache + closes modal
  const handleClose = () => {
    reset({
      name: "",
      ratioId: null,
      branchId: undefined as any,
      screenIds: [],
    });
    dispatch(setGroupName(""));

    queryClient.removeQueries({ queryKey: GROUP_SCREENS_QK, exact: false });

    onClose();
  };

  const onSubmit = (values: FormValues) => {
    // Only enforce "at least 2 screens" when ADDING a group
    if (!isEdit && (!values.screenIds || values.screenIds.length < 2)) {
      setError("screenIds", {
        type: "manual",
        message: "Select at least 2 screens",
      });
      return;
    }

    const basePayload = {
      name: values.name.trim(),
      branchId: values.branchId,
      assignScreens: values.screenIds.map((id) => ({ screenId: id })),
      ...(values.ratioId != null ? { ratioId: values.ratioId } : {}),
      playlistId: selectedPlaylistId ? Number(selectedPlaylistId) : null,
    };

    const handleError = (err: any) => {
      const msg =
        err?.response?.data?.errors?.branchId?.[0] ??
        err?.response?.data?.errors?.ratioId?.[0] ??
        err?.response?.data?.errors?.screenIds?.[0] ??
        err?.response?.data?.error ??
        err?.response?.data?.message;

      if (msg?.toLowerCase().includes("branch")) {
        setError("branchId", { type: "server", message: msg });
      } else if (msg?.toLowerCase().includes("ratio")) {
        setError("ratioId", { type: "server", message: msg });
      } else if (msg?.toLowerCase().includes("screen")) {
        setError("screenIds", { type: "server", message: msg });
      }

      setUiError(err);
    };

    if (isEdit && selectedGroup) {
      const payload: UpdateGroupPayload = {
        id: Number(selectedGroup.id),
        ...basePayload,
      };

      updateGroup(payload, {
        onSuccess: () => {
          handleClose();
        },
        onError: handleError,
      });
    } else {
      const payload: AddGroupPayload = basePayload;

      addGroup(payload, {
        onSuccess: () => {
          handleClose();
        },
        onError: handleError,
      });
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Modal overlay & panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-lg relative max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-800"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            {/* Header */}
            <div className="border-b pb-3 pr-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {isEdit ? "Edit Group" : "Add New Group"}
              </h3>
              <p className="text-sm text-neutral-500">
                {isEdit
                  ? "Update this group’s settings and assigned screens."
                  : "Configure your group’s name, branch, ratio, and assigned screens."}
              </p>
            </div>

            {/* Form */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-5">
              {/* Group Name */}
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1 block">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name", {
                    onChange: (e) => dispatch(setGroupName(e.target.value)),
                  })}
                  placeholder="e.g., Front Window Group"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                />
                {errors.name ? (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.name.message}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 mt-1">
                    Give this group a clear and recognizable name.
                  </p>
                )}
              </div>

              {/* Branch + Add branch */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-neutral-700 mb-1 block">
                    Branch
                  </label>
                  <BranchDropdown />
                  {errors.branchId && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.branchId.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center justify-center gap-2 mt-1 sm:mt-5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
                >
                  <Plus size={16} /> Add Branch
                </button>
              </div>

              {/* Ratio */}
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1 block">
                  Group Ratio <span className="text-red-500">*</span>
                </label>
                <ScreenRatioDropdown allowNone noneLabel="None" />
                <input
                  type="hidden"
                  {...register("ratioId", { valueAsNumber: true })}
                />
                {errors.ratioId && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.ratioId.message}
                  </p>
                )}
              </div>

              {/* Screens */}
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Assign Screens{" "}
                  {!isEdit && <span className="text-red-500">*</span>}
                </label>

                <div className="rounded-lg border border-neutral-200 p-3">
                  {screensLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-5 w-2/3 animate-pulse rounded bg-neutral-200"
                        />
                      ))}
                    </div>
                  ) : totalScreens === 0 ? (
                    <p className="text-sm text-neutral-500">
                      {shouldFilterByRatio
                        ? `No screens match the selected ratio (${selectedRatioName}).`
                        : "No screens available."}
                    </p>
                  ) : (
                    <>
                      <ul className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {visibleScreens.map((sc: any) => (
                          <li key={sc.screenId}>
                            <Controller
                              name="screenIds"
                              control={control}
                              render={({ field }) => {
                                const value = (field.value || []) as number[];
                                const checked = value.includes(
                                  Number(sc.screenId)
                                );

                                return (
                                  <label className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 hover:bg-neutral-50 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-red-500"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          field.onChange([
                                            ...value,
                                            Number(sc.screenId),
                                          ]);
                                        } else {
                                          field.onChange(
                                            value.filter(
                                              (id) => id !== Number(sc.screenId)
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <span className="text-sm text-neutral-800">
                                      {sc.name || `Screen #${sc.screenId}`}
                                    </span>
                                    <span className="ml-auto text-xs text-neutral-500">
                                      {sc.branch ?? "No branch"} •{" "}
                                      {sc.ratio ?? "—"}
                                    </span>
                                  </label>
                                );
                              }}
                            />
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-neutral-500">
                          Showing {Math.min(visible, totalScreens)} of{" "}
                          {totalScreens}
                        </p>
                        <div className="flex items-center gap-2">
                          {visible > 5 && (
                            <button
                              type="button"
                              onClick={() =>
                                setVisible((v) => Math.max(5, v - 5))
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                            >
                              <ChevronUp size={14} /> Show less
                            </button>
                          )}
                          {visible < totalScreens && (
                            <button
                              type="button"
                              onClick={() =>
                                setVisible((v) =>
                                  Math.min(totalScreens, v + 5)
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                            >
                              <ChevronDown size={14} /> Show 5 more
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

              <div>
                <DefaultPlaylistDropdown />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !isValid || isSubmitting || isAddPending || isUpdatePending
                }
                className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {isAddPending || isUpdatePending
                  ? isEdit
                    ? "Updating..."
                    : "Saving..."
                  : isEdit
                  ? "Save Changes"
                  : "Save Group"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Nested modals / toasts */}
      <AddBranchModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
      {uiError && (
        <ErrorToast
          error={uiError}
          onClose={() => setUiError(null)}
          autoHideMs={8000}
          anchor="top-right"
        />
      )}
    </>
  );
};

export default AddGroupModal;
