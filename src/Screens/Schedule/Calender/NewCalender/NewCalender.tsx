import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
} from "@fullcalendar/core";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedBlock,
  clearSelectedBlock,
  selectSelectedBlock,
  type Block,
} from "../../../../Redux/Block/BlockSlice";

/* ✅ Only focused lists + selected devices (NO selectAllReservedBlocks) */
import {
  selectReservedSelectedGroups,
  selectReservedSelectedScreens,
  selectReservedBlockforScreen,
  selectReservedBlockforGroup,
  type ReservedBlock,
} from "../../../../Redux/ReservedBlocks/ReservedBlocks";
import ReservedAssignSchedulebar from "./ReservedAssignSchedulebar";

/* 👇 bring scheduleItem blocks (normal layer) */
import {
  selectScheduleItemBlocks,
  removeScheduleItemBlock,
} from "../../../../Redux/ScheduleItem/ScheduleItemSlice";
import type { ScheduleBlock } from "../../../../Redux/ScheduleItem/GetScheduleItemBlocks";

import { useDeleteReservedBlock } from "../../../../Redux/Block/DeleteBlock";

declare global {
  interface Window {
    __draggingPlaylist?: boolean;
  }
}
const isDraggingPlaylist = () => Boolean(window.__draggingPlaylist);

/* -------------------------------- types ---------------------------------- */
type CalenderProps = {
  initialView?: "timeGridWeek" | "timeGridDay" | "dayGridMonth";
  events?: Array<{
    id?: string;
    title: string;
    start: string | Date;
    end?: string | Date;
    allDay?: boolean;
    extendedProps?: { borderClass?: string };
  }>;
  onDateClick?: (arg: DateClickArg) => void;
  onEventClick?: (arg: EventClickArg) => void;
};

type LocalEvt = {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  extendedProps?: {
    borderClass?: string;
    isLocal?: boolean;
    [k: string]: any;
  };
};

/* -------------------------------- helpers -------------------------------- */
const DEFAULT_BORDER = "border-red-600";
const FOCUSED_GRAY_BORDER = "border-zinc-400"; // gray stripe for focused lists only

const minutesToDur = (m: number) => {
  const mins = Math.max(1, Math.min(360, Math.floor(m || 0)));
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h)}:${pad(mm)}:00`;
};

const toTs = (v?: Date | string | null) =>
  !v ? Number.NaN : typeof v === "string" ? new Date(v).getTime() : v.getTime();

function colorize(input: LocalEvt[]): LocalEvt[] {
  const arr = [...input].sort((a, b) => {
    const as = toTs(a.start),
      bs = toTs(b.start);
    if (as !== bs) return as - bs;
    return (toTs(a.end) || as) - (toTs(b.end) || bs);
  });
  return arr.map((e) => ({
    ...e,
    extendedProps: {
      ...(e.extendedProps ?? {}),
      borderClass: e.extendedProps?.borderClass ?? DEFAULT_BORDER,
      isLocal: e.extendedProps?.isLocal ?? false,
    },
  }));
}

const toBg = (cls?: string) =>
  cls && cls.startsWith("border-")
    ? cls.replace("border-", "bg-")
    : cls ?? "bg-red-600";

let uid = 1;
const newId = () => `e${uid++}`;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmtDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTime = (d: Date) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const toDateFromReserved = (
  startDate?: string,
  startTime?: string,
  endDate?: string,
  endTime?: string
) => {
  const start =
    (startDate && startTime && new Date(`${startDate}T${startTime}`)) ||
    undefined;
  const end =
    (endDate && endTime && new Date(`${endDate}T${endTime}`)) || undefined;
  return {
    start: start && !isNaN(start.getTime()) ? start : undefined,
    end: end && !isNaN(end.getTime()) ? end : undefined,
  };
};

/* 👇 Helpers for scheduleItemBlocks (YYYY-MM-DD + HH:mm:ss) → Date */
function joinDayTime(day?: string, time?: string): Date | undefined {
  if (!day || !time) return undefined;
  const d = new Date(`${day}T${time}`);
  return isNaN(d.getTime()) ? undefined : d;
}

/* Convert a ScheduleBlock to a sidebar Block (for edit drawer) */
function blockFromScheduleItem(b: ScheduleBlock): Block {
  const start = joinDayTime(b.start_day, b.start_time) ?? new Date();
  const end =
    joinDayTime(b.end_day ?? b.start_day, b.end_time) ??
    new Date(start.getTime() + 30 * 60 * 1000);

  return {
    id: b.id,
    playlistId: (b as any)?.playlistId,
    playlistName: (b as any)?.playlistName ?? (b as any)?.title ?? `#${b.id}`,
    start_day: fmtDay(start),
    start_time: fmtTime(start),
    end_day: fmtDay(end),
    end_time: fmtTime(end),
    screens: (b.screens ?? [])
      .map((s: any) => Number(s?.id))
      .filter((n: number) => Number.isFinite(n))
      .map((n: number) => ({ screenId: n })),
    groups: (b.groups ?? [])
      .map((g: any) => Number(g?.id))
      .filter((n: number) => Number.isFinite(n))
      .map((n: number) => ({ groupId: n })),
  };
}

/* ------------------------------- component ------------------------------- */
const NewCalender: React.FC<CalenderProps> = ({
  initialView = "timeGridWeek",
  events,
  onDateClick,
  onEventClick,
}) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [slotStepMin, setSlotStepMin] = useState<number>(30);
  const dispatch = useDispatch();

  /* 🔁 delete hook for persisted blocks */
  const { mutateAsync: deleteBlock } = useDeleteReservedBlock();

  /* 🔁 Only using selected devices + focused lists */
  const selectedScreens = useSelector(selectReservedSelectedScreens);
  const selectedGroups = useSelector(selectReservedSelectedGroups);
  const reservedBlockforScreen = useSelector(selectReservedBlockforScreen);
  const reservedBlockforGroup = useSelector(selectReservedBlockforGroup);

  /* 👇 normal layer (persisted schedule blocks in ScheduleItem slice) */
  const scheduleItemBlocks = useSelector(selectScheduleItemBlocks);

  const selectedBlock = useSelector(selectSelectedBlock);

  const [evts, setEvts] = useState<LocalEvt[]>(
    colorize((events ?? []).map((e, i) => ({ ...e, id: e.id ?? `seed-${i}` })))
  );

  /* 👉 Only show backend events if there’s a device selection */
  const hasAnySelection =
    (selectedScreens?.length ?? 0) > 0 || (selectedGroups?.length ?? 0) > 0;

  /* ⭐ Focused blocks: prefer screen; fallback to group */
  const focusedBlocksRaw = useMemo(() => {
    const scr = reservedBlockforScreen ?? [];
    const grp = reservedBlockforGroup ?? [];
    return scr.length > 0 ? scr : grp;
  }, [reservedBlockforScreen, reservedBlockforGroup]);

  /* Convert ONLY focused reserved blocks → gray events */
  const focusEvents: LocalEvt[] = useMemo(() => {
    if (!hasAnySelection) return []; // nothing selected → show nothing
    return (focusedBlocksRaw ?? []).map((b) => {
      const { start, end } = toDateFromReserved(
        b.startDate,
        b.startTime,
        b.endDate,
        b.endTime
      );
      const startSafe = start ?? new Date();
      const endSafe =
        end ?? new Date(startSafe.getTime() + Math.max(1, slotStepMin) * 60000);
      const title = b.title || b.scheduleItemName || `Block #${b.id}`;
      return {
        id: `block-${b.id}`,
        title,
        start: startSafe,
        end: endSafe,
        allDay: false,
        extendedProps: { borderClass: FOCUSED_GRAY_BORDER, isLocal: false },
      };
    });
  }, [focusedBlocksRaw, slotStepMin, hasAnySelection]);

  /* 👇 Normal layer (from ScheduleItem slice) → default design, show delete × */
  const scheduleItemEvents: LocalEvt[] = useMemo(() => {
    const blocks = scheduleItemBlocks ?? [];
    return blocks.map((b: any) => {
      const start = joinDayTime(b.start_day, b.start_time);
      const end =
        joinDayTime(b.end_day ?? b.start_day, b.end_time) ||
        (start
          ? new Date(start.getTime() + Math.max(1, slotStepMin) * 60000)
          : new Date());

      // Prefer stored playlistName / title
      const title = b.title ?? b.playlistName ?? `#${b.id}`;

      return {
        id: String(b.id), // server id
        title,
        start: start ?? new Date(),
        end,
        allDay: false,
        extendedProps: {
          borderClass: DEFAULT_BORDER, // default stripe style
          isLocal: false, // persisted → we will show delete ×
        },
      };
    });
  }, [scheduleItemBlocks, slotStepMin]);

  /* Final render list: focused (gray) + scheduleItem (default) + local drafts */
  const finalEvents = useMemo(
    () =>
      colorize([
        ...(focusEvents ?? []),
        ...(scheduleItemEvents ?? []),
        ...(evts ?? []),
      ]),
    [focusEvents, scheduleItemEvents, evts]
  );

  /* Helpers for deletion of persisted events */
  const toServerId = (eventId: string): number | null => {
    if (!eventId) return null;
    if (eventId.startsWith("block-")) {
      const n = Number(eventId.replace("block-", ""));
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(eventId);
    return Number.isFinite(n) ? n : null;
  };

  const handleDeleteEvent = async (eventId: string) => {
    const idNum = toServerId(eventId);
    if (!idNum) return;
    if (!window.confirm("Delete this block?")) return;
    try {
      await deleteBlock(idNum);
      dispatch(removeScheduleItemBlock(idNum));
      setEvts((prev) =>
        prev.filter((x) => x.id !== String(idNum) && x.id !== `block-${idNum}`)
      );
      window.dispatchEvent(
        new CustomEvent("schedule/removed", { detail: { id: String(idNum) } })
      );
    } catch (err) {
      console.error("[Calendar delete] error:", err);
    }
  };

  const renderEvent = (content: EventContentArg) => {
    const { borderClass, isLocal } =
      (content.event.extendedProps as {
        borderClass?: string;
        isLocal?: boolean;
      }) || {};

    const isFocused = borderClass === FOCUSED_GRAY_BORDER;
    const stripeBg = toBg(borderClass || DEFAULT_BORDER);

    const onRemoveLocal = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const id = content.event.id;
      setEvts((prev) => prev.filter((x) => x.id !== id));
    };

    return (
      <div
        title={`${content.event.title} • ${content.timeText}`}
        className={[
          "relative w-full h-full rounded-xl shadow-sm pl-3 pr-3 py-2",
          isFocused
            ? "bg-zinc-100 border border-zinc-300 text-neutral-800"
            : "bg-white border border-neutral-200 text-neutral-900",
        ].join(" ")}
      >
        {!isFocused && (
          <div
            className={[
              "absolute left-0 top-1/2 -translate-y-1/2",
              "h-[calc(100%-10px)] w-1.5",
              "rounded-full",
              stripeBg,
            ].join(" ")}
          />
        )}

        {/* Local drafts keep the × to remove locally */}
        {isLocal && (
          <button
            aria-label="Remove local"
            onClick={onRemoveLocal}
            className={[
              "absolute right-1 top-1",
              "h-5 w-5 flex items-center justify-center",
              "rounded-full border bg-white/90",
              isFocused
                ? "border-zinc-300 text-zinc-600"
                : "border-neutral-300 text-neutral-500",
              "hover:text-red-600 hover:border-red-300",
              "transition-colors",
            ].join(" ")}
          >
            ×
          </button>
        )}

        {/* Persisted events (focused gray or normal red) → show delete × */}
        {!isLocal && (
          <button
            aria-label="Delete"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDeleteEvent(content.event.id as string);
            }}
            className={[
              "absolute right-1 top-1",
              "h-5 w-5 flex items-center justify-center",
              "rounded-full border bg-white/90",
              isFocused
                ? "border-zinc-300 text-zinc-600"
                : "border-neutral-300 text-neutral-500",
              "hover:text-red-600 hover:border-red-300",
              "transition-colors",
            ].join(" ")}
          >
            ×
          </button>
        )}

        <div
          className={[
            "text-[11px] leading-none",
            isFocused ? "text-zinc-600" : "text-neutral-600",
          ].join(" ")}
        >
          {content.timeText}
        </div>
        <div
          className={[
            "mt-1 line-clamp-1 text-xs font-semibold",
            isFocused ? "text-zinc-800" : "text-neutral-900",
          ].join(" ")}
        >
          {content.event.title}
        </div>
      </div>
    );
  };

  // --- local create/edit handlers ---
  const handleSelect = (sel: DateSelectArg) => {
    if (isDraggingPlaylist()) {
      sel.view.calendar.unselect();
      return;
    }
    const start = sel.start;
    const end = sel.end ?? new Date(start.getTime() + 30 * 60000);
    if (end.getTime() - start.getTime() < 5 * 60 * 1000) {
      sel.view.calendar.unselect();
      return;
    }
    const block: LocalEvt = {
      id: newId(),
      title: "New Block",
      start,
      end,
      allDay: false,
      extendedProps: { borderClass: DEFAULT_BORDER, isLocal: true },
    };
    setEvts((prev) => colorize([...prev, block]));
    sel.view.calendar.unselect();
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (isDraggingPlaylist()) return;
    const start = arg.date;
    const end = new Date(start.getTime() + 30 * 60000);
    const block: LocalEvt = {
      id: newId(),
      title: "New Block",
      start,
      end,
      allDay: false,
      extendedProps: { borderClass: DEFAULT_BORDER, isLocal: true },
    };
    setEvts((prev) => colorize([...prev, block]));
    onDateClick?.(arg);
  };

  const handleEventDrop = (arg: EventDropArg) => {
    const id = arg.event.id;
    const start = arg.event.start!;
    const end = arg.event.end ?? new Date(start.getTime() + 30 * 60000);
    setEvts((prev) =>
      colorize(prev.map((e) => (e.id === id ? { ...e, start, end } : e)))
    );
  };

  useEffect(() => {
    // Old flow support
    const onCommitted = (e: Event) => {
      const detail = (e as CustomEvent<{ localId?: string }>).detail;
      if (!detail?.localId) return;
      setEvts((prev) => prev.filter((x) => x.id !== detail.localId));
    };
    window.addEventListener(
      "schedule/local-committed",
      onCommitted as EventListener
    );
    return () => {
      window.removeEventListener(
        "schedule/local-committed",
        onCommitted as EventListener
      );
    };
  }, []);

  /* Remove local draft when sidebar emits "replace-local" */
  useEffect(() => {
    const onReplace = (e: Event) => {
      const { localId } =
        (
          e as CustomEvent<{
            localId?: string;
            newId?: string;
            persisted?: boolean;
          }>
        ).detail ?? {};
      if (!localId) return;
      setEvts((prev) => prev.filter((x) => x.id !== localId));
    };
    window.addEventListener(
      "schedule/replace-local",
      onReplace as EventListener
    );
    return () => {
      window.removeEventListener(
        "schedule/replace-local",
        onReplace as EventListener
      );
    };
  }, []);

  /* Also respond to external "removed" events */
  useEffect(() => {
    const onRemoved = (e: Event) => {
      const { id } = (e as CustomEvent<{ id?: string }>).detail ?? {};
      if (!id) return;
      setEvts((prev) => prev.filter((x) => x.id !== id && x.id !== `block-${id}`));
    };
    window.addEventListener("schedule/removed", onRemoved as EventListener);
    return () => {
      window.removeEventListener("schedule/removed", onRemoved as EventListener);
    };
  }, []);

  const handleEventResize = (arg: EventResizeDoneArg) => {
    const id = arg.event.id;
    const start = arg.event.start!;
    const end = arg.event.end!;
    setEvts((prev) =>
      colorize(prev.map((e) => (e.id === id ? { ...e, start, end } : e)))
    );
  };

  /* 🔁 ReservedBlock → Block (for the Assign drawer) */
  function selectedFromReserved(b: ReservedBlock): Block {
    const start =
      (b.startDate && b.startTime && `${b.startDate}T${b.startTime}`) || null;
    const end = (b.endDate && b.endTime && `${b.endDate}T${b.endTime}`) || null;
    const startD = start ? new Date(start) : new Date();
    const endD =
      end && !isNaN(new Date(end).getTime())
        ? new Date(end)
        : new Date(startD.getTime() + 30 * 60000);

    return {
      id: b.id,
      playlistId: b.playlistId,
      playlistName: b.title ?? b.scheduleItemName ?? `Block #${b.id}`,
      start_day: fmtDay(startD),
      start_time: fmtTime(startD),
      end_day: fmtDay(endD),
      end_time: fmtTime(endD),
      screens: (b.screens ?? [])
        .map((s) => Number(s.id))
        .filter((n) => Number.isFinite(n))
        .map((n) => ({ screenId: n })),
      groups: (b.groups ?? [])
        .map((g) => Number(g.id))
        .filter((n) => Number.isFinite(n))
        .map((n) => ({ groupId: n })),
      created_at: undefined,
      updated_at: undefined,
    };
  }

  // ✅ local version stays as-is
  function selectedFromLocal(
    evt: { id: string; title: string; start: Date; end?: Date },
    extras?: {
      playlistId?: string | number;
      isInteractive?: boolean;
      durationSec?: number;
    }
  ): Block {
    const start = evt.start;
    const end = evt.end ?? new Date(start.getTime() + 30 * 60 * 1000);

    return {
      id: evt.id,
      playlistName: evt.title || "New Block",
      playlistId:
        extras?.playlistId != null ? Number(extras.playlistId) : undefined,
      start_day: fmtDay(start),
      start_time: fmtTime(start),
      end_day: fmtDay(end),
      end_time: fmtTime(end),
      screens: [] as { screenId: number }[],
      groups: [] as { groupId: number }[],
    };
  }

  /* Event click: check reserved first; else try scheduleItem; else local */
  const onEventClickInternal = (arg: any) => {
    setAssignOpen(true);

    const id = arg.event.id as string;

    if (id.startsWith("block-")) {
      // Focused reserved block
      const key = id.replace("block-", "");
      const src = focusedBlocksRaw ?? [];
      const raw = src.find((b) => String(b.id) === key);
      if (raw) {
        dispatch(setSelectedBlock(selectedFromReserved(raw)));
      }
    } else {
      // Try to find in ScheduleItem (persisted normal layer)
      const numericId = Number(id);
      const sb = (scheduleItemBlocks ?? []).find(
        (b: any) => Number(b?.id) === numericId
      );
      if (sb) {
        dispatch(setSelectedBlock(blockFromScheduleItem(sb)));
      } else {
        // Fallback: treat as local
        const start = arg.event.start ?? new Date();
        const end = arg.event.end ?? new Date(start.getTime() + 30 * 60000);
        const ext = (arg.event.extendedProps || {}) as any;

        dispatch(
          setSelectedBlock(
            selectedFromLocal(
              { id, title: arg.event.title, start, end },
              {
                playlistId: ext?.playlistId,
                isInteractive: ext?.isInteractive,
                durationSec: ext?.durationSec,
              }
            )
          )
        );
      }
    }

    onEventClick?.(arg);
  };



  return (
    <>
      <div className="w-full">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-semibold text-neutral-800">
                Calendar
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => calendarRef.current?.getApi().today()}
                className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Today
              </button>
              <button
                onClick={() => calendarRef.current?.getApi().prev()}
                className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                ←
              </button>
              <button
                onClick={() => calendarRef.current?.getApi().next()}
                className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                →
              </button>

              <div className="mx-1 hidden h-6 w-px bg-neutral-200 md:block" />

              <button
                onClick={() =>
                  calendarRef.current?.getApi().changeView("timeGridWeek")
                }
                className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Week
              </button>
              <button
                onClick={() =>
                  calendarRef.current?.getApi().changeView("timeGridDay")
                }
                className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Day
              </button>
              <button
                onClick={() =>
                  calendarRef.current?.getApi().changeView("dayGridMonth")
                }
                className="rounded-2xl border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Month
              </button>

              {/* Step input */}
              <div className="ml-2 flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700">
                <span className="text-neutral-600">Step (min)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={360}
                  step={1}
                  value={slotStepMin}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSlotStepMin(Number.isFinite(v) ? v : 30);
                  }}
                  onBlur={(e) => {
                    const v = Math.max(
                      1,
                      Math.min(360, Math.floor(Number(e.target.value) || 30))
                    );
                    if (v !== slotStepMin) setSlotStepMin(v);
                  }}
                  className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-2 md:p-4 fat-slots">
            <FullCalendar
              ref={calendarRef as any}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={initialView}
              headerToolbar={false}
              expandRows={false}
              dayMaxEvents={false}
              slotDuration={minutesToDur(slotStepMin)}
              snapDuration={minutesToDur(slotStepMin)}
              slotLabelInterval={slotStepMin < 30 ? { minutes: 60 } : undefined}
              nowIndicator
              selectable
              selectMirror
              selectOverlap
              unselectAuto
              selectLongPressDelay={50}
              defaultTimedEventDuration="00:30:00"
              selectMinDistance={8}
              editable
              eventOverlap={false}
              eventDisplay="block"
              events={finalEvents}
              scrollTime="00:00:00"
              scrollTimeReset={false}
              allDaySlot={false}
              droppable={true}
              eventReceive={(arg) => {
                const start = arg.event.start ?? new Date();
                const end =
                  arg.event.end ??
                  new Date(start.getTime() + slotStepMin * 60000);

                const ext = (arg.event.extendedProps || {}) as any;

                const localEvt: LocalEvt = {
                  id: newId(),
                  title: arg.event.title || "New Block",
                  start,
                  end,
                  allDay: false,
                  extendedProps: {
                    ...ext,
                    borderClass: DEFAULT_BORDER,
                    isLocal: true,
                  },
                };

                setEvts((prev) => colorize([...prev, localEvt]));

                setAssignOpen(true);
                dispatch(
                  setSelectedBlock(
                    selectedFromLocal(
                      { id: localEvt.id, title: localEvt.title, start, end },
                      {
                        playlistId: ext?.playlistId,
                        isInteractive: ext?.isInteractive,
                        durationSec: ext?.durationSec,
                      }
                    )
                  )
                );

                arg.event.remove();
                window.__draggingPlaylist = false;
              }}
              // Prevent creation while dragging from list
              selectAllow={() => !isDraggingPlaylist()}
              dateClick={handleDateClick}
              eventClick={onEventClickInternal}
              select={handleSelect}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventContent={renderEvent}
              stickyHeaderDates
              windowResizeDelay={50}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
              slotLabelFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
              eventBackgroundColor="transparent"
              eventBorderColor="transparent"
              eventTextColor="inherit"
              eventClassNames={() => ["overflow-visible", "px-0", "py-0"]}
            />
          </div>
        </div>
      </div>

      {/* --- assign drawer --- */}
      {assignOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={() => {
              setAssignOpen(false);
              dispatch(clearSelectedBlock());
            }}
          />
          <aside
            className="fixed right-0 top-0 z-50 h-full w-[360px] border-l border-gray-200 bg-white shadow-xl"
            role="dialog"
            aria-label="Assign playlist"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="text-sm font-semibold text-gray-900">
                Assign playlist
              </div>
              <div className="flex items-center gap-2">
                {/* Delete button visible only when a persisted block is selected */}
                {(() => {
                  const sb = selectedBlock as Block | null;
                  const persisted =
                    sb?.id != null &&
                    (Number.isFinite(Number(sb.id)) ||
                      String(sb.id).startsWith("block-"));
                  return persisted ? (
                    <button
                      onClick={async () => {
                        const raw = String(sb!.id);
                        const idNum = raw.startsWith("block-")
                          ? Number(raw.replace("block-", ""))
                          : Number(raw);
                        if (!Number.isFinite(idNum)) return;
                        if (!window.confirm("Delete this block?")) return;
                        try {
                          await deleteBlock(idNum);
                          dispatch(removeScheduleItemBlock(idNum));
                          window.dispatchEvent(
                            new CustomEvent("schedule/removed", {
                              detail: { id: String(idNum) },
                            })
                          );
                          setAssignOpen(false);
                          dispatch(clearSelectedBlock());
                        } catch (err) {
                          console.error("[Drawer delete] error:", err);
                        }
                      }}
                      className="rounded-md border border-red-300 px-2 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  ) : null;
                })()}
                <button
                  onClick={() => {
                    setAssignOpen(false);
                    dispatch(clearSelectedBlock());
                  }}
                  className="rounded-md border border-gray-200 px-2 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="h-[calc(100%-48px)] overflow-y-auto p-3 scrollbar-hide">
              <ReservedAssignSchedulebar
                onCancel={() => {
                  setAssignOpen(false);
                  dispatch(clearSelectedBlock());
                }}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default NewCalender;
