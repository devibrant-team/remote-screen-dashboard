import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddScreen } from "../../ReactQuery/Screen/useAddScreen";
import { useUpdateScreen } from "../../ReactQuery/Screen/useUpdateScreen";

import {
  resetScreenForm,
  setScreenName,
  setScreenCode,
  setScreenGroupId,
} from "../../Redux/AddScreen/AddScreenSlice";
import ScreenRatioDropdown from "../Dropdown/ScreenRatioDropdown";
import GroupDropdown from "../Dropdown/GroupDropdown";
import { useQueryClient } from "@tanstack/react-query";
import BranchDropdown from "../Dropdown/BranchDropdown";
import { Plus } from "lucide-react";
import AddBranchModal from "../../Screens/ScreenManagement/AddBranchModal";
import DefaultPlaylistDropdown from "../../Screens/ScreenManagement/DefaultPlaylistModal";
import {
  selectedDefaultPlaylistId,
  setDefaultPlaylist,
  setSelectedBranchId,
  setSelectedRatio,
} from "../../Redux/ScreenManagement/ScreenManagementSlice";
import type { UpdateScreenPayload } from "../../ReactQuery/Screen/UpdateScreen";
const schema = z.object({
  name: z.string().trim().min(1, "Screen name is required").max(80, "Too long"),
  code: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\d{6}$/.test(val),
      "Code must be exactly 6 digits"
    ),
});

type FormValues = z.infer<typeof schema>;

type AddScreenModalProps = { isEdit?: boolean; editingScreen?: any | null };

const AddScreenModal: React.FC<AddScreenModalProps> = ({
  isEdit = false,
  editingScreen,
}) => {
  const dispatch = useDispatch();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const isEditing = Boolean(isEdit && editingScreen && editingScreen.id);

  const selectedRatioid = useSelector(
    (s: RootState) => s.screenManagement.selectedRatioId
  );
  const selectedPlaylistId = useSelector(selectedDefaultPlaylistId);
  const selectedBranchId = useSelector(
    (s: RootState) => s.screenManagement.selectedBranchId
  );

  const {
    name: nameFromStore,
    code: codeFromStore,
    groupId,
  } = useSelector((s: RootState) => s.screenForm);

  const { mutate: createScreen, isPending: isCreating } = useAddScreen();
  const { mutate: updateScreen, isPending: isUpdating } = useUpdateScreen();

  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: nameFromStore || "", code: codeFromStore || "" },
  });

  // Preload in EDIT mode
  useEffect(() => {
    if (!isEditing || !editingScreen) return;

    reset({
      name: editingScreen.name || "",
      code: editingScreen.code || "",
    });

    if (editingScreen.name) dispatch(setScreenName(editingScreen.name));
    if (editingScreen.code) dispatch(setScreenCode(editingScreen.code));

    if (editingScreen.ratioId && editingScreen.ratio) {
      dispatch(
        setSelectedRatio({
          id: editingScreen.ratioId,
          name: editingScreen.ratio,
        })
      );
    }

    if (editingScreen.branchId) {
      dispatch(setSelectedBranchId(editingScreen.branchId));
    }

    if (editingScreen.groupId) {
      dispatch(setScreenGroupId(editingScreen.groupId));
    }

    if (editingScreen.PlaylistId) {
      dispatch(setDefaultPlaylist(editingScreen.PlaylistId));
    }
  }, [isEditing, editingScreen, reset, dispatch]);

  // When *not* editing (add mode) → clear everything
  useEffect(() => {
    if (isEditing || editingScreen) return;

    reset({ name: "", code: "" });
    dispatch(setScreenName(""));
    dispatch(setScreenCode(""));
    dispatch(setScreenGroupId(null));
    dispatch(setSelectedBranchId(null));
    dispatch(setSelectedRatio({ id: null, name: null }));
    dispatch(setDefaultPlaylist(null));
  }, [isEditing, editingScreen, reset, dispatch]);

  // sanitize code
  const code = watch("code");
  useEffect(() => {
    if (code == null) return;
    const sanitized = code.replace(/\D/g, "").slice(0, 6);
    if (sanitized !== code) {
      setValue("code", sanitized, { shouldValidate: true });
      dispatch(setScreenCode(sanitized));
    }
  }, [code, setValue, dispatch]);

  const close = () => window.dispatchEvent(new Event("close-add-screen-modal"));
  const onSubmit = (values: FormValues) => {
    const isEditing = Boolean(isEdit && editingScreen && editingScreen.id);

    if (!isEditing && !values.code) {
      alert("Code is required and must be 6 digits.");
      return;
    }

    const basePayload = {
      name: values.name.trim(),
      code: values.code ?? "",
      ratio_id: selectedRatioid ?? null,
      branch_id: selectedBranchId ?? null,
      group_id: groupId ?? null,
      playlist_id: selectedPlaylistId ? Number(selectedPlaylistId) : null,
    };

    if (isEditing && editingScreen) {
      const payload: UpdateScreenPayload = {
        screenId: editingScreen.screenId,
        name: values.name.trim(),
        code: values.code ?? "",
        ratio_id: selectedRatioid ?? null,
        branch_id: selectedBranchId ?? null,
        group_id: groupId ?? null,
        playlist_id: selectedPlaylistId ? Number(selectedPlaylistId) : null,
      };

      console.log("🔧 Edit screen payload:", payload);

      updateScreen(payload, {
        onSuccess: () => {
          dispatch(resetScreenForm());
          queryClient.invalidateQueries({ queryKey: ["screens"] });
          close();
        },
        onError: (err) => console.error("Update screen failed:", err),
      });
    } else {
      const payload = basePayload;

      console.log("🆕 Create screen payload:", payload);

      createScreen(payload, {
        onSuccess: () => {
          dispatch(resetScreenForm());
          queryClient.invalidateQueries({ queryKey: ["screens"] });
          close();
        },
        onError: (err) => console.error("Add screen failed:", err),
      });
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
        <div className="border-b pb-2">
          <h3 className="text-base font-semibold text-neutral-900">
            {isEditing ? "Edit Screen" : "Add Screen"}
          </h3>
          <p className="text-sm text-neutral-500">
            {isEditing
              ? "Update screen settings and defaults."
              : "Configure a new screen."}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
          <div
            className={`grid gap-4 ${
              isEditing ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            <div className="col-span-1">
              <label className="text-sm font-medium text-neutral-700">
                Screen Name *
              </label>
              <input
                {...register("name", {
                  onChange: (e) => dispatch(setScreenName(e.target.value)),
                })}
                placeholder="Front Window TV"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {!isEditing && (
              <div>
                <label className="text-sm font-medium text-neutral-700">
                  Code (6 digits)
                </label>
                <input
                  {...register("code", {
                    onChange: (e) => dispatch(setScreenCode(e.target.value)),
                  })}
                  placeholder="102345"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                />
                {errors.code && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.code.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="text-sm font-medium text-neutral-700 mb-1 block">
                Branch
              </label>
              <BranchDropdown />
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-9 py-2 mt-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
            >
              <Plus size={18} /> Add Branch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1 block">
                Screen Ratio
              </label>
              <ScreenRatioDropdown />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1 block">
                Group
              </label>
              <GroupDropdown />
            </div>
          </div>

          {groupId == null && (
            <div>
              <DefaultPlaylistDropdown />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {isPending
              ? isEditing
                ? "Updating..."
                : "Saving..."
              : isEditing
              ? "Save Changes"
              : "Add Screen"}
          </button>
        </div>
      </form>

      <AddBranchModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
};

export default AddScreenModal;
