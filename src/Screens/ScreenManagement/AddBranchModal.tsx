import React, { useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { useAddBranch } from "../../ReactQuery/Branch/useAddBranch";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type AddBranchModalProps = {
  open: boolean;
  onClose: () => void;
};

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter at least 2 characters.")
    .max(64, "Please keep it under 64 characters."),
});

type FormValues = z.infer<typeof schema>;

const AddBranchModal: React.FC<AddBranchModalProps> = ({ open, onClose }) => {
  const qc = useQueryClient();
  const { mutate, isPending } = useAddBranch();

  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ name: "" });
      // focus after paint
      setTimeout(() => setFocus("name"), 0);
    }
  }, [open, reset, setFocus]);

  if (!open) return null;

  const onSubmit = (values: FormValues) => {
    return new Promise<void>((resolve) => {
      // react-hook-form supports async submit; wrap mutate in a promise
      mutate(values.name.trim(), {
        onSuccess: async () => {
          await qc.invalidateQueries({ queryKey: ["branches"] });
          onClose();
          resolve();
        },
        onError: (err: any) => {
          // Surface server error at the form root
          setError("root", {
            type: "server",
            message: err?.message || "Server error. Please try again.",
          });
          resolve();
        },
      });
    });
  };

  const disabled = !isValid || isSubmitting || isPending;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      {/* Dialog */}
      <div
        className="absolute inset-x-4 top-8 mx-auto max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5 sm:inset-x-0 sm:top-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-semibold text-neutral-900">Add Branch</h3>
          <button
            onClick={onClose}
            className="rounded p-2 text-neutral-500 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-5 py-5">
            {/* Server error (root) */}
            {"root" in errors && errors.root?.message && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errors.root.message}
              </div>
            )}

            <label htmlFor="branchName" className="block text-sm font-medium text-neutral-700">
              Branch Name
            </label>
            <input
              id="branchName"
              placeholder="e.g., Downtown Branch"
              {...register("name")}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "branchName-error" : undefined}
            />
            {errors.name && (
              <p id="branchName-error" className="mt-2 text-xs text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isPending}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:w-auto disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting || isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              {isSubmitting || isPending ? "Saving..." : "Save Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBranchModal;
