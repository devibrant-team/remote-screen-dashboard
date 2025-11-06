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

// ---------- Helpers for schedule conflict formatting ----------

type ScheduleConflictUi = {
  title: string;
  items: string[];
};

function findConflictsNode(obj: any): any | null {
  if (!obj || typeof obj !== "object") return null;

  // Direct shape: { conflicts: { conflicts: [...], raw: [...] } }
  if (
    obj.conflicts &&
    (Array.isArray(obj.conflicts.raw) || Array.isArray(obj.conflicts.conflicts))
  ) {
    return obj.conflicts;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = findConflictsNode(item);
      if (res) return res;
    }
  } else {
    for (const key of Object.keys(obj)) {
      const res = findConflictsNode(obj[key]);
      if (res) return res;
    }
  }

  return null;
}

function extractScheduleConflictsFromRaw(raw: any): ScheduleConflictUi | null {
  const conflictsNode = findConflictsNode(raw);
  if (!conflictsNode) return null;

  const rawArr = conflictsNode.raw;
  if (!Array.isArray(rawArr) || rawArr.length === 0) return null;

  const items: string[] = [
    "Schedule conflicts detected for one or more screens:",
  ];

  rawArr.forEach((entry: any) => {
    const details0 = entry.details?.[0] ?? {};
    const screenName =
      details0.screen?.name ??
      (details0.screen_id ? `Screen #${details0.screen_id}` : "Unknown screen");

    const playlistName =
      entry.playlist?.name ??
      (entry.playlist_id ? `Playlist #${entry.playlist_id}` : "Unknown playlist");

    const scheduleName =
      entry.schedule_item?.name ??
      (entry.schedule_item_id
        ? `Schedule #${entry.schedule_item_id}`
        : "Unknown schedule");

    const startDay = entry.start_day ?? "";
    const endDay = entry.end_day ?? "";
    const startTime =
      typeof entry.start_time === "string"
        ? entry.start_time.slice(0, 5)
        : "";
    const endTime =
      typeof entry.end_time === "string" ? entry.end_time.slice(0, 5) : "";

    const timePart =
      startDay && endDay
        ? `${startDay} ${startTime} → ${endDay} ${endTime}`
        : "";

    items.push(
      [
        `Screen: ${screenName}`,
        `Playlist: ${playlistName}`,
        `Schedule: ${scheduleName}`,
        timePart && `Time: ${timePart}`,
      ]
        .filter(Boolean)
        .join(" – ")
    );
  });

  return {
    title: "Schedule conflict",
    items,
  };
}

function sanitize(parsed: ParsedApiError) {
  // Special handling: schedule conflicts
  const conflictUi = extractScheduleConflictsFromRaw(parsed.raw);
  if (conflictUi) {
    return {
      ...parsed,
      title: conflictUi.title,
      items: conflictUi.items,
      code: undefined,
    };
  }

  // Generic behavior for all other errors
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
      parsed.title, // e.g. "Error" or "Schedule conflict"
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

  const displayItems =
    parsed.items && parsed.items.length ? parsed.items : ["Unknown error"];

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
          {parsed.title}
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
