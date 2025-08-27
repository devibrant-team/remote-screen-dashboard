import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddScreen } from "../../ReactQuery/Screen/useAddScreen";
import { resetScreenForm } from "../../Redux/AddScreen/AddScreenSlice";
import ScreenRatioDropdown from "../Dropdown/ScreenRatioDropdown";
import BranchDropdown from "../Dropdown/BranchDropdown";
import GroupDropdown from "../Dropdown/GroupDropdown";
import {
  setScreenName,
  setScreenCode,
} from "../../Redux/AddScreen/AddScreenSlice";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  name: z.string().trim().min(1, "Screen name is required").max(80, "Too long"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});
type FormValues = z.infer<typeof schema>;

const AddScreenModal: React.FC = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const selectedRatioid = useSelector(
    (state: RootState) => state.screenManagement.selectedRatioId
  );
  const selectedBranchId = useSelector(
    (state: RootState) => state.screenManagement.selectedBranchId
  );

  const { mutate: addScreen, isPending } = useAddScreen();
  // read current selection/state from your AddScreen slice
  const {
    name: nameFromStore,
    code: codeFromStore,
    groupId,
  } = useSelector((s: RootState) => s.screenForm);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: nameFromStore || "",
      code: codeFromStore || "",
    },
  });

  // keep the code strictly numeric + max 6 and mirror to Redux
  const code = watch("code");
  React.useEffect(() => {
    if (code == null) return;
    const sanitized = code.replace(/\D/g, "").slice(0, 6);
    if (sanitized !== code) {
      setValue("code", sanitized, { shouldValidate: true });
      dispatch(setScreenCode(sanitized));
    }
  }, [code, setValue, dispatch]);

  const close = () => window.dispatchEvent(new Event("close-add-screen-modal"));

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name.trim(),
      code: values.code,
      ratio_id: selectedRatioid ?? null,
      branch_id: selectedBranchId ?? null,
      group_id: groupId ?? null,
    };

    addScreen(payload, {
      onSuccess: () => {
        dispatch(resetScreenForm());
        queryClient.invalidateQueries({ queryKey: ["screens"] });
        close();
      },
      onError: (err) => {
        // show inline error or toast
        console.error("Add screen failed:", err);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      {/* Header */}
      <div className="mb-4">
        <p className="mt-1 text-sm text-neutral-600">
          Name your screen and configure its display ratio, branch, and group.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Screen Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="screen-name"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Screen Name <span className="text-red-500">*</span>
            </label>
            <input
              id="screen-name"
              placeholder="e.g., Front Window TV"
              {...register("name", {
                onChange: (e) => dispatch(setScreenName(e.target.value)),
              })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">
                Give this screen a short, recognizable name.
              </p>
            )}
          </div>

          {/* Code (6 digits) */}
          <div>
            <label
              htmlFor="screen-code"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Code (6 digits)
            </label>
            <input
              id="screen-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="e.g., 102345"
              {...register("code", {
                onChange: (e) => {
                  // mirror to Redux immediately (sanitization handled in effect)
                  dispatch(setScreenCode(e.target.value));
                },
              })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
            />
            {errors.code ? (
              <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
            ) : null}
          </div>

          {/* Ratio */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Screen Ratio
            </label>
            <ScreenRatioDropdown />
          </div>

          {/* Branch */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Branch
            </label>
            <BranchDropdown />
          </div>

          {/* Group */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Group
            </label>
            <GroupDropdown />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={close}
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

export default AddScreenModal;
