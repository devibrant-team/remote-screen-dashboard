// Components/ErrorToast.tsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Clipboard } from "lucide-react";
import {
  parseApiError,
  type ParsedApiError,
} from "../Redux/Error/parseApiError";

export type ErrorToastProps = {
  error: unknown; // axios error, string, etc.
  onClose?: () => void;
  autoHideMs?: number; // e.g., 7000
  anchor?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  debugToggle?: boolean; // show 'Details' toggle
};

const posMap: Record<NonNullable<ErrorToastProps["anchor"]>, string> = {
  "top-right": "top-4 right-4",
  "bottom-right": "bottom-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-left": "bottom-4 left-4",
};

// Hide generic axios/transport messages
const HIDE_PATTERNS = [/^request failed with status code/i, /^network error$/i];

function sanitize(parsed: ParsedApiError) {
  const items = (parsed.items ?? []).filter(
    (m) => !HIDE_PATTERNS.some((rx) => rx.test(m))
  );
  // Force the title to a constant "Error"
  return { ...parsed, title: "Error", items, code: undefined };
}

const Card: React.FC<{
  parsed: ParsedApiError;
  onClose?: () => void;
  debugToggle?: boolean;
}> = ({ parsed, onClose, debugToggle }) => {
  const [open, setOpen] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  if (!open) return null;

  const copy = async () => {
    const text = [
      parsed.title, // always "Error"
      ...(parsed.items ?? []),
      parsed.requestId ? `Request-Id: ${parsed.requestId}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const displayItems = parsed.items.length ? parsed.items : ["Unknown error"];

  return (
    <div
      ref={ref}
      className="w-[min(92vw,420px)] rounded-xl border border-red-200 bg-white shadow-2xl"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-red-100">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 text-sm font-semibold text-red-700">
          {parsed.title /* "Error" */}
        </div>
        <button
          onClick={copy}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
          title="Copy"
          aria-label="Copy error"
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
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2">
        <ul className="list-disc pl-5 text-[13px] text-gray-800 space-y-1">
          {displayItems.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>

        {(parsed.requestId || debugToggle) && (
          <div className="mt-2 flex items-center justify-between">
            {/* HTTP code intentionally omitted */}
            <div className="text-[11px] text-gray-500">
              {parsed.requestId ? `Req ${parsed.requestId}` : ""}
            </div>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-[11px] text-gray-600 underline underline-offset-2 hover:text-gray-800"
            >
              {showDetails ? "Hide details" : "Details"}
            </button>
          </div>
        )}

        {showDetails && (
          <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-gray-50 p-2 text-[11px] text-gray-700">
            {JSON.stringify(parsed.raw, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onClose,
  autoHideMs = 7000,
  anchor = "top-right",
  debugToggle = false,
}) => {
  const parsed = sanitize(parseApiError(error));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = window.setTimeout(() => onClose?.(), autoHideMs);
    return () => window.clearTimeout(t);
  }, [autoHideMs, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed z-[9999] ${posMap[anchor]}`}>
      <Card parsed={parsed} onClose={onClose} debugToggle={debugToggle} />
    </div>,
    document.body
  );
};

export default ErrorToast;
