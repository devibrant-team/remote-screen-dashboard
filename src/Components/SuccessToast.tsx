// Components/SuccessToast.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Clipboard } from "lucide-react";

export type SuccessToastProps = {
  title?: string; // default: "Success"
  message?: string; // single main message
  items?: string[]; // optional bullet list
  onClose?: () => void;
  autoHideMs?: number; // e.g. 5000
  anchor?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  debugToggle?: boolean; // show 'Details' toggle with raw text
  raw?: unknown; // optional raw payload if you want to inspect it
};

const posMap: Record<NonNullable<SuccessToastProps["anchor"]>, string> = {
  "top-right": "top-4 right-4",
  "bottom-right": "bottom-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-left": "bottom-4 left-4",
};

const SuccessCard: React.FC<
  Omit<SuccessToastProps, "anchor" | "autoHideMs">
> = ({ title, message, items, onClose, debugToggle, raw }) => {
  const [open, setOpen] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  if (!open) return null;

  const listItems =
    items && items.length
      ? items
      : message
      ? [message]
      : ["Operation completed successfully."];

  const copy = async () => {
    const text = [
      title ?? "Success",
      ...listItems,
      raw ? JSON.stringify(raw, null, 2) : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="w-[min(92vw,420px)] rounded-xl border border-emerald-200 bg-white shadow-2xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-100">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 text-sm font-semibold text-emerald-700">
          {title ?? "Success"}
        </div>
        <button
          onClick={copy}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
          title="Copy"
          aria-label="Copy details"
        >
          <Clipboard className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
          title="Close"
          aria-label="Close toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2">
        <ul className="list-disc pl-5 text-[13px] text-gray-800 space-y-1">
          {listItems.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>

        {/* 🔧 FIX: coerce raw to boolean with !!raw */}
        {debugToggle && !!raw && (
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-[11px] text-gray-600 underline underline-offset-2 hover:text-gray-800"
            >
              {showDetails ? "Hide details" : "Details"}
            </button>
          </div>
        )}

        {/* 🔧 FIX: same here */}
        {showDetails && !!raw && (
          <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-gray-50 p-2 text-[11px] text-gray-700">
            {JSON.stringify(raw, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export const SuccessToast: React.FC<SuccessToastProps> = ({
  title,
  message,
  items,
  onClose,
  autoHideMs = 5000,
  anchor = "top-right",
  debugToggle = false,
  raw,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = window.setTimeout(() => onClose?.(), autoHideMs);
    return () => window.clearTimeout(t);
  }, [autoHideMs, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed z-[9999] ${posMap[anchor]}`}>
      <SuccessCard
        title={title}
        message={message}
        items={items}
        onClose={onClose}
        debugToggle={debugToggle}
        raw={raw}
      />
    </div>,
    document.body
  );
};

export default SuccessToast;
