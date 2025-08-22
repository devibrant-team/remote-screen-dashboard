import React, { useEffect, useRef, useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { useAddBranch } from "../../ReactQuery/Branch/useAddBranch";
import { useQueryClient } from "@tanstack/react-query";

type AddBranchModalProps = {
  open: boolean;
  onClose: () => void;
};

const AddBranchModal: React.FC<AddBranchModalProps> = ({ open, onClose }) => {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const qc = useQueryClient();
  const { mutate, isPending, isError, error } = useAddBranch();

  useEffect(() => {
    if (open) {
      setName("");
      setTouched(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const isValid = name.trim().length >= 2;

  const handleSave = () => {
    setTouched(true);
    if (!isValid || isPending) return;

    mutate(name.trim(), {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: ["branches"] });
        onClose();
      },
      onError: (err: any) => {
        console.error(err);
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute inset-x-4 top-8 mx-auto max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5 sm:inset-x-0 sm:top-20">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-neutral-900">Add Branch</h3>
          <button onClick={onClose} className="rounded p-2 text-neutral-500 hover:bg-neutral-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          <label htmlFor="branchName" className="block text-sm font-medium text-neutral-700">
            Branch Name
          </label>
          <input
            id="branchName"
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g., Downtown Branch"
            className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
          />
          {touched && !isValid && (
            <p className="mt-2 text-xs text-red-600">Please enter at least 2 characters.</p>
          )}
          {isError && (
            <p className="mt-2 text-xs text-red-600">{(error as any)?.message || "Server error"}</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 border-t sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            {isPending ? "Saving..." : "Save Branch"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBranchModal;
