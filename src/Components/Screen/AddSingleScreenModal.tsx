import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export type Option = { id: string | number; name: string };

export type ScreenFormData = {
  name: string;
  ratio: string;
  branchId: string | number;
  groupId: string | number | null; // null = No Group
};

type AddSingleScreenModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ScreenFormData) => void;

  branches: Option[];                 // e.g. [{id:1, name:"Downtown Branch"}]
  groups: Option[];                   // e.g. [{id:10, name:"Group 1"}]
  ratios?: string[];                  // defaults below
  noGroupOption?: Option;             // override label/id if needed
  defaultBranchId?: Option["id"];     // optionally preselect
  defaultRatio?: string;              // optionally preselect
};

const DEFAULT_RATIOS = ["unassigned", "16:9", "9:16", "4:3"];

const AddSingleScreenModal: React.FC<AddSingleScreenModalProps> = ({
  open,
  onClose,
  onConfirm,
  branches,
  groups,
  ratios = DEFAULT_RATIOS,
  noGroupOption = { id: "none", name: "No Group" },
  defaultBranchId,
  defaultRatio,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const initialBranchId = useMemo< string | number | undefined >(
    () => defaultBranchId ?? branches[0]?.id,
    [defaultBranchId, branches]
  );

  const [name, setName] = useState("");
  const [ratio, setRatio] = useState<string>(defaultRatio ?? ratios[0] ?? "unassigned");
  const [branchId, setBranchId] = useState<string | number>(initialBranchId ?? "");
  const [groupId, setGroupId] = useState<string | number>(noGroupOption.id);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    // reset state on open
    setName("");
    setRatio(defaultRatio ?? ratios[0] ?? "unassigned");
    setBranchId(initialBranchId ?? "");
    setGroupId(noGroupOption.id);
    setTouched(false);
    // autofocus
    setTimeout(() => inputRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initialBranchId, defaultRatio, ratios, noGroupOption.id, onClose]);

  const isValid =
    name.trim().length >= 2 &&
    String(branchId).length > 0 &&
    String(ratio).length > 0;

  const handleConfirm = () => {
    setTouched(true);
    if (!isValid) return;

    onConfirm({
      name: name.trim(),
      ratio,
      branchId,
      groupId: groupId === noGroupOption.id ? null : groupId,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

      <div className="absolute inset-x-4 top-8 mx-auto max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5 sm:inset-x-0 sm:top-20">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-neutral-900">Add Single Screen</h3>
          <button onClick={onClose} className="rounded p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Screen Name</label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="e.g., Lobby TV"
              className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
            {touched && name.trim().length < 2 && (
              <p className="mt-2 text-xs text-red-600">Please enter at least 2 characters.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Screen Ratio</label>
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400"
            >
              {ratios.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Assign to Group</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400"
            >
              <option value={noGroupOption.id}>{noGroupOption.name}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 px-5 py-4 border-t sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className="w-full sm:w-auto rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSingleScreenModal;
