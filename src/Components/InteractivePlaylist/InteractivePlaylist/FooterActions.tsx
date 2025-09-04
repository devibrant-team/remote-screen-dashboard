
export default function FooterActions({
  summary,
  onCancel,
  onSave,
  disabled,
  label,
}: {
  summary: string;
  onCancel: () => void;
  onSave: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
      <div className="text-[12px] text-slate-600">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">{summary}</span>
      </div>
      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
          type="button"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={disabled}
          className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
          type="button"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
