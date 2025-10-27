import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAllReservedBlocks } from "./ReservedBlockSlice";

export type ReservedEvent = {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  backgroundColor: string;
  borderColor: string;
  classNames: string[];
  extendedProps: {
    isReserved: true;
    raw: any;
  };
};

/** Accepts DD-MM-YYYY or YYYY-MM-DD */
function parseDateTimeFlexible(dateStr: string, timeStr: string) {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split("-").map(Number);
  let y = 0, m = 0, d = 0;
  if (parts[0] > 31) [y, m, d] = parts; else [d, m, y] = parts;

  const [hh = 0, mi = 0, ss = 0] = (timeStr || "00:00:00")
    .split(":")
    .map((x) => Number(x || 0));

  return new Date(y, (m || 1) - 1, d || 1, hh, mi, ss);
}

/** Build full, gray reserved events for a specific screenId */
export function useReservedEvents(overlayScreenId?: number | null) {
  const reservedBlocks = useSelector(selectAllReservedBlocks);

  const events: ReservedEvent[] = useMemo(() => {
    if (!overlayScreenId) return [];

    const evts: ReservedEvent[] = [];
    for (const b of reservedBlocks) {
      const isForScreen = b.screens?.some(
        (s: any) => Number(s.screenId) === overlayScreenId
      );
      if (!isForScreen) continue;

      const start = parseDateTimeFlexible(b.startDate, b.startTime);
      const end = parseDateTimeFlexible(b.endDate, b.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      evts.push({
        id: `reserved-${overlayScreenId}-${b.id ?? `${b.startDate}-${b.startTime}`}`,
        title: b.title || `Playlist ${b.playlistId ?? ""}`,
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: "#9CA3AF", // gray-400
        borderColor: "#6B7280",     // gray-500
        classNames: ["reserved-event"],
        extendedProps: { isReserved: true as const, raw: b },
      });
    }
    return evts;
  }, [overlayScreenId, reservedBlocks]);

  return events;
}

/** Type guard */
export function isReservedEvent(arg: any): boolean {
  return !!arg?.event?.extendedProps?.isReserved;
}

/** Styles for reserved events (call from eventDidMount) */
export function styleReservedEvent(el: HTMLElement) {
  el.style.background = "#9CA3AF";
  el.style.border = "1px solid #6B7280";
  el.style.borderRadius = "8px";
  el.style.overflow = "hidden";
  el.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.04)";
  el.style.zIndex = "60"; // slightly below editable cards if overlapped
}

/** Content for reserved events (call from eventContent) */
export function ReservedEventContent(arg: any) {
  return (
    <div className="h-full w-full px-1.5 py-1">
      <div className="text-[10px] font-semibold text-gray-900">{arg.timeText}</div>
      <div className="truncate text-[11px] font-semibold text-gray-800">
        {arg.event.title}
      </div>
    </div>
  );
}
