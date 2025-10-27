import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type EventReceiveArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import type {
  EventContentArg,
  EventDropArg,
  DatesSetArg,
} from "@fullcalendar/core";

import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "@reduxjs/toolkit";

import { addItem, setItemTimes } from "../../Redux/Schedule/SheduleSlice";
import { selectAllScheduleItems } from "../../Redux/Schedule/ScheduleSelectors";

import { selectAllReservedBlocks } from "../../Redux/Schedule/ReservedBlocks/ReservedBlockSlice";
import { selectOverlayScreenId } from "../../Redux/Schedule/UiSlice";

import ScheduleAssignSidebar from "./Components/ScheduleAssignSidebar";

/* -------------------------------- types ---------------------------------- */
type ViewMode = "timeGridDay" | "timeGridWeek" | "dayGridMonth";
type VisibleRange = { start: Date; end: Date };
type BaseEvent = { id: string; title: string; start: string; end: string };
type CalendarEvent = BaseEvent & {
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: Record<string, any>;
};

/* A schedule-like shape we can pass into the sidebar when editing reserved */
type ScheduleLike = {
  id: string;
  title: string;
  playlistId: string | number | "";
  startDate: string; // DD-MM-YYYY
  startTime: string; // HH:mm:ss
  endDate: string;   // DD-MM-YYYY
  endTime: string;   // HH:mm:ss
  screens: Array<{ screenId: number }>;
  groups: Array<{ groupId: number }>;
  _reservedBlockId?: string | number;
};

/* ----------------------- lane colors (lane 0 is red) ---------------------- */
const LANE_COLORS = [
  "#EF4444",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EC4899",
];

/* ---------------- helpers: date parsing/formatting ------------------------ */
const toDDMMYYYY = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};
const toHHMMSS = (d: Date) => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mi}:${ss}`;
};
function parseDateTime(dateStr: string, timeStr: string) {
  // accepts DD-MM-YYYY or YYYY-MM-DD (also works if "/" is used)
  if (!dateStr) return new Date(NaN);
  const sep = dateStr.includes("-") ? "-" : "/";
  const parts = dateStr.split(sep).map((x) => Number(x));
  let y = 0, m = 0, d = 0;
  if (parts[0] > 31) [y, m, d] = parts; // YYYY-MM-DD
  else [d, m, y] = parts;               // DD-MM-YYYY

  const [hh = 0, mi = 0, ss = 0] = (timeStr || "00:00:00")
    .split(":")
    .map((x) => Number(x || 0));

  return new Date(y, (m || 1) - 1, d || 1, hh, mi, ss);
}

function isoToDMYHHMMSS(iso: string) {
  const d = new Date(iso);
  return {
    dmy: toDDMMYYYY(d),
    hms: toHHMMSS(d),
  };
}

/* --------- Build overlapping lanes for prettier side-by-side events ------- */
function decorateForEdit(evts: BaseEvent[]): CalendarEvent[] {
  type Tmp = BaseEvent & { sd: Date; ed: Date; used?: boolean };
  const tmp: Tmp[] = evts.map((e) => ({
    ...e,
    sd: new Date(e.start),
    ed: new Date(e.end),
  }));
  const overlaps = (a: Tmp, b: Tmp) => a.sd < b.ed && b.sd < a.ed;

  const out: CalendarEvent[] = [];
  for (let i = 0; i < tmp.length; i++) {
    const root = tmp[i];
    if (root.used) continue;

    const cluster: Tmp[] = [root];
    root.used = true;

    let grew = true;
    while (grew) {
      grew = false;
      for (let j = 0; j < tmp.length; j++) {
        const c = tmp[j];
        if (c.used) continue;
        if (cluster.some((x) => overlaps(x, c))) {
          c.used = true;
          cluster.push(c);
          grew = true;
        }
      }
    }

    type Lane = { end: Date };
    const lanes: Lane[] = [];
    const assigned: Array<{ ev: Tmp; laneIdx: number }> = [];

    cluster
      .slice()
      .sort((a, b) => a.sd.getTime() - b.sd.getTime())
      .forEach((ev) => {
        let slot = lanes.findIndex((l) => l.end <= ev.sd);
        if (slot === -1) {
          lanes.push({ end: ev.ed });
          slot = lanes.length - 1;
        } else {
          lanes[slot].end = ev.ed;
        }
        assigned.push({ ev, laneIdx: slot });
      });

    for (const { ev, laneIdx } of assigned) {
      const color = LANE_COLORS[laneIdx % LANE_COLORS.length];
      out.push({
        id: ev.id,
        title: ev.title,
        start: ev.start,
        end: ev.end,
        backgroundColor: "transparent",
        borderColor: "transparent",
        extendedProps: { laneIndex: laneIdx, laneColor: color },
      });
    }
  }
  return out;
}

/* ================================ component =============================== */
export default function Calendar() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const dispatch = useDispatch();

  const [assignOpen, setAssignOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("timeGridWeek");
  const [currentRangeLabel, setCurrentRangeLabel] = useState("");

  // NEW: if set, we're editing a reserved block (gray)
  const [reservedEditItem, setReservedEditItem] = useState<ScheduleLike | null>(null);

  const overlayScreenId = useSelector(selectOverlayScreenId);
  const reservedBlocks = useSelector(selectAllReservedBlocks);

  useEffect(() => {
    // Debug visibility for the toggle
    console.log("[Calendar] overlayScreenId:", overlayScreenId);
  }, [overlayScreenId]);

  /* ------------------- RESERVED (gray, full-size, read-only) -------------- */
  const reservedEvents = useMemo(() => {
    if (!overlayScreenId) return [];

    const evts: CalendarEvent[] = [];
    for (const b of reservedBlocks) {
      const matchesScreen = b.screens?.some(
        (s: any) => Number(s.screenId) === overlayScreenId
      );
      if (!matchesScreen) continue;

      const start = parseDateTime(b.startDate, b.startTime);
      const end = parseDateTime(b.endDate, b.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      evts.push({
        id: `reserved-${overlayScreenId}-${b.id ?? `${b.startDate}-${b.startTime}`}`,
        title: b.title || `Playlist ${b.playlistId ?? ""}`,
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: "#9CA3AF", // gray-400
        borderColor: "#6B7280",     // gray-500
        extendedProps: { isReserved: true, raw: b },
      });
    }
    return evts;
  }, [overlayScreenId, reservedBlocks]);

  /* ----------------------- NEW/EDITABLE CALENDAR ITEMS -------------------- */
  const receivingRef = useRef(false);
  const lastReceiveKeyRef = useRef<{ key: string; ts: number } | null>(null);

  const items = useSelector(selectAllScheduleItems);
  const baseEvents: BaseEvent[] = useMemo(() => {
    return items.map((it) => {
      const start = parseDateTime(it.startDate, it.startTime);
      const end = parseDateTime(it.endDate, it.endTime);
      return {
        id: it.id,
        title: it.title || `Playlist ${it.playlistId ?? ""}`,
        start: start.toISOString(),
        end: end.toISOString(),
      };
    });
  }, [items]);

  const calendarEvents = useMemo(() => decorateForEdit(baseEvents), [baseEvents]);

  /* -------------------------- Calendar handlers --------------------------- */
  const handleEventClick = (arg: any) => {
    const ext = arg.event.extendedProps || {};
    const isReserved = !!ext.isReserved;

    if (isReserved) {
      // Build a schedule-like object from reserved raw
      const raw = ext.raw || {};
      const { dmy: sd, hms: st } = isoToDMYHHMMSS(arg.event.startStr);
      const { dmy: ed, hms: et } = isoToDMYHHMMSS(arg.event.endStr);

      const screens = Array.isArray(raw.screens)
        ? raw.screens
            .map((s: any) => Number(s?.screenId))
            .filter((n: number) => Number.isFinite(n))
            .map((screenId: number) => ({ screenId }))
        : [];

      const groups = Array.isArray(raw.groups)
        ? raw.groups
            .map((g: any) => Number(g?.groupId))
            .filter((n: number) => Number.isFinite(n))
            .map((groupId: number) => ({ groupId }))
        : [];

      setReservedEditItem({
        id: String(raw.id ?? arg.event.id),
        title: String(raw.title ?? arg.event.title ?? ""),
        playlistId: String(raw.playlistId ?? ""),
        startDate: sd,
        startTime: st,
        endDate: ed,
        endTime: et,
        screens,
        groups,
        _reservedBlockId: raw.id ?? arg.event.id,
      });

      setActiveItemId(null);     // NOT editing a draft item
      setAssignOpen(true);
      return;
    }

    // default: editing a draft/new item from schedule slice
    setReservedEditItem(null);
    setActiveItemId(arg.event.id);
    setAssignOpen(true);
  };

  const DEFAULT_SECONDS = 10 * 60;

  const handleEventReceive = (info: EventReceiveArg) => {
    const ev = info.event;
    const title = ev.title || "Playlist";
    const playlistId = String((ev.extendedProps as any)?.playlistId || "");
    const durationSec = Number(
      (ev.extendedProps as any)?.durationSec || DEFAULT_SECONDS
    );

    const start = ev.start as Date;
    const end = (ev.end as Date) ?? new Date(start.getTime() + durationSec * 1000);

    // de-dupe key: same title+playlist+start within 500ms
    const key = `${title}|${playlistId}|${start.getTime()}`;
    const now = Date.now();
    if (
      lastReceiveKeyRef.current &&
      lastReceiveKeyRef.current.key === key &&
      now - lastReceiveKeyRef.current.ts < 500
    ) {
      ev.remove();
      return;
    }
    lastReceiveKeyRef.current = { key, ts: now };
    receivingRef.current = true;

    dispatch(
      addItem({
        id: nanoid(),
        title,
        playlistId,
        startDate: toDDMMYYYY(start),
        startTime: toHHMMSS(start),
        endDate: toDDMMYYYY(end),
        endTime: toHHMMSS(end),
        screens: [],
        groups: [],
      })
    );

    ev.remove();
    setTimeout(() => {
      receivingRef.current = false;
    }, 50);
  };

  const handleEventDrop = (arg: EventDropArg) => {
    const { event } = arg;
    if (event.extendedProps?.isReserved) {
      // If later you want to allow drag-resize of reserved, branch here
      return;
    }
    const start = event.start as Date;
    const end = (event.end as Date) ?? new Date(start.getTime() + 60 * 1000);
    dispatch(
      setItemTimes({
        id: event.id,
        startDate: toDDMMYYYY(start),
        startTime: toHHMMSS(start),
        endDate: toDDMMYYYY(end),
        endTime: toHHMMSS(end),
      })
    );
  };

  const handleEventResize = (arg: EventResizeDoneArg) => {
    const { event } = arg;
    if (event.extendedProps?.isReserved) {
      // If later you want to allow drag-resize of reserved, branch here
      return;
    }
    const start = event.start as Date;
    const end = (event.end as Date) ?? new Date(start.getTime() + 60 * 1000);
    dispatch(
      setItemTimes({
        id: event.id,
        startDate: toDDMMYYYY(start),
        startTime: toHHMMSS(start),
        endDate: toDDMMYYYY(end),
        endTime: toHHMMSS(end),
      })
    );
  };

  const handleSelect = (info: any) => {
    if (receivingRef.current) return;
    const start = info.start as Date;
    const end = info.end as Date;
    dispatch(
      addItem({
        id: nanoid(),
        title: "New Item",
        playlistId: "",
        startDate: toDDMMYYYY(start),
        startTime: toHHMMSS(start),
        endDate: toDDMMYYYY(end),
        endTime: toHHMMSS(end),
        screens: [],
        groups: [],
      })
    );
  };

  /* --------------------------- event cosmetics --------------------------- */
  const handleEventDidMount = (arg: any) => {
    const isReserved = !!arg.event.extendedProps?.isReserved;

    if (isReserved) {
      // solid gray, full block
      arg.el.style.background = "#9CA3AF"; // gray-400
      arg.el.style.border = "1px solid #6B7280"; // gray-500
      arg.el.style.borderRadius = "8px";
      arg.el.style.overflow = "hidden";
      arg.el.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.04)";
      arg.el.title = arg.event.title;
      arg.el.style.zIndex = "60";
      return;
    }

    // editable “new” blocks style
    const ext: any = arg.event.extendedProps || {};
    arg.el.style.background = "transparent";
    arg.el.style.border = "none";
    arg.el.style.marginLeft = "2px";
    arg.el.style.marginRight = "2px";
    arg.el.style.marginTop = "1px";
    arg.el.style.marginBottom = "1px";
    arg.el.style.borderRadius = "10px";
    arg.el.style.overflow = "hidden";
    arg.el.style.boxShadow = "0 3px 10px rgba(0,0,0,0.18)";
    if (ext.laneIndex != null) arg.el.style.zIndex = String(100 + ext.laneIndex);
  };

  const renderEventContent = (arg: EventContentArg) => {
    const isReserved = !!arg.event.extendedProps?.isReserved;

    if (isReserved) {
      return (
        <div className="h-full w-full px-1.5 py-1">
          <div className="text-[10px] font-semibold text-gray-900">
            {arg.timeText}
          </div>
          <div className="truncate text-[11px] font-semibold text-gray-800">
            {arg.event.title}
          </div>
        </div>
      );
    }

    const ext: any = arg.event.extendedProps || {};
    const laneColor = ext.laneColor ?? "#EF4444";
    return (
      <div className="h-full w-full">
        <div className="flex h-full w-full rounded-md bg-white/95">
          <div
            style={{ background: laneColor }}
            className="w-1.5 shrink-0 rounded-l-md"
          />
          <div className="min-w-0 p-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-900">
                {arg.timeText}
              </span>
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: laneColor }}
              />
            </div>
            <div className="truncate text-[11px] font-semibold text-gray-800">
              {arg.event.title}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------- nav api ------------------------------- */
  const api = () => calendarRef.current?.getApi();
  const handleToday = () => api()?.today();
  const handlePrev = () => api()?.prev();
  const handleNext = () => api()?.next();
  const switchView = (v: ViewMode) => {
    api()?.changeView(v);
    setViewMode(v);
  };

  /* ------------------------------- header label --------------------------- */
  const formatRangeLabel = (range: VisibleRange, viewType: string) => {
    const start = range.start;
    const realEnd = new Date(range.end.getTime() - 1);
    const s = {
      month: start.toLocaleString("en-US", { month: "short" }),
      day: start.getDate(),
      year: start.getFullYear(),
    };
    const e = {
      month: realEnd.toLocaleString("en-US", { month: "short" }),
      day: realEnd.getDate(),
      year: realEnd.getFullYear(),
    };
    if (viewType === "timeGridDay") return `${s.month} ${s.day}, ${s.year}`;
    if (s.year === e.year && s.month === e.month)
      return `${s.month} ${s.day} – ${e.day}, ${s.year}`;
    return `${s.month} ${s.day}, ${s.year} – ${e.month} ${e.day}, ${e.year}`;
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    const newViewType = arg.view.type as ViewMode;
    if (viewMode !== newViewType) setViewMode(newViewType);
    setCurrentRangeLabel(
      formatRangeLabel({ start: arg.start, end: arg.end }, arg.view.type)
    );
  };

  return (
    <div className="flex h-full w-full flex-col rounded border border-gray-200 bg-white shadow-inner">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-gray-200 px-3 py-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row md:items-center md:gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handleToday}
              className="h-8 rounded border border-gray-300 bg-white px-3 text-[12px] font-medium leading-none text-[#1a1f2e] shadow-sm hover:bg-gray-50"
            >
              Today
            </button>
            <div className="flex h-8 overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
              <button
                onClick={handlePrev}
                className="px-2 text-[13px] leading-none hover:bg-gray-50"
              >
                ‹
              </button>
              <div className="w-px bg-gray-300" />
              <button
                onClick={handleNext}
                className="px-2 text-[13px] leading-none hover:bg-gray-50"
              >
                ›
              </button>
            </div>
          </div>
          <div className="mt-2 text-[13px] font-semibold leading-none text-[#1a1f2e] md:mt-0">
            {currentRangeLabel || " "}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[12px] font-medium text-[#1a1f2e]">
          <button
            className={
              "rounded border px-2 py-1 text-xs " +
              (viewMode === "timeGridDay"
                ? "border-[#1a1f2e] bg-[#1a1f2e] text-white"
                : "border-gray-300 bg-white text-[#1a1f2e] hover:bg-gray-50")
            }
            onClick={() => switchView("timeGridDay")}
          >
            Day
          </button>
          <button
            className={
              "rounded border px-2 py-1 text-xs " +
              (viewMode === "timeGridWeek"
                ? "border-[#1a1f2e] bg-[#1a1f2e] text-white"
                : "border-gray-300 bg-white text-[#1a1f2e] hover:bg-gray-50")
            }
            onClick={() => switchView("timeGridWeek")}
          >
            Week
          </button>
          <button
            className={
              "rounded border px-2 py-1 text-xs " +
              (viewMode === "dayGridMonth"
                ? "border-[#1a1f2e] bg-[#1a1f2e] text-white"
                : "border-gray-300 bg-white text-[#1a1f2e] hover:bg-gray-50")
            }
            onClick={() => switchView("dayGridMonth")}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="min-h-0 flex-1 text-[12px] [&_.fc]:text-[12px] [&_.fc-scrollgrid]:border-0">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView={viewMode}
          headerToolbar={false}
          allDaySlot={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotDuration="01:00:00"
          expandRows={true}
          nowIndicator={true}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          /* interactions */
          selectable={true}
          selectMirror={true}
          selectAllow={() => !receivingRef.current}
          editable={true}
          eventResizableFromStart={true}
          eventOverlap={true}
          droppable={true}
          eventReceive={handleEventReceive}
          /* handlers */
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          // disallow dragging/resizing reserved events
          eventAllow={(_dropInfo, draggedEvent) => !draggedEvent?.extendedProps?.isReserved}
          /* data */
          events={[...calendarEvents, ...reservedEvents]}
          eventDidMount={handleEventDidMount}
          eventContent={renderEventContent}
          datesSet={handleDatesSet}
          /* layout */
          height="100%"
          dayHeaderClassNames={"bg-gray-50 text-[11px] font-semibold text-[#1a1f2e] border-b border-gray-200"}
          slotLaneClassNames={"border-gray-100"}
          slotLabelClassNames={"pr-2 text-[11px] font-medium text-gray-500"}
        />
      </div>

      <ScheduleAssignSidebar
        open={assignOpen}
        itemId={activeItemId}
        mode={reservedEditItem ? "editReserved" : "create"}
        overrideItem={reservedEditItem || undefined}
        onClose={() => {
          setAssignOpen(false);
          setReservedEditItem(null);
          setActiveItemId(null);
        }}
        onSubmit={(payload) => {
          console.log("Assign submit:", {
            mode: reservedEditItem ? "editReserved" : "create",
            itemId: payload.itemId,
            screens: payload.screens,
            groups: payload.groups,
            reservedBlockId: reservedEditItem?._reservedBlockId,
          });
        }}
      />
    </div>
  );
}
