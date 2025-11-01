// CalenderForScheduleItem.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import AssignSchedulebar from "../AssignSchedulebar";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
} from "@fullcalendar/core";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import {
  setSelectedBlock,
  clearSelectedBlock,
  selectSelectedBlock,
  type Block,
} from "../../../Redux/Block/BlockSlice";

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
  extendedProps?: { borderClass?: string; isLocal?: boolean; [k: string]: any };
};

/* -------------------------------- helpers -------------------------------- */
const DEFAULT_BORDER = "border-red-600";

const minutesToDur = (m: number) => {
  const mins = Math.max(1, Math.min(360, Math.floor(m || 0)));
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h)}:${pad(mm)}:00`;
};

const toTs = (v?: Date | string | null) =>
  !v ? Number.NaN : typeof v === "string" ? new Date(v).getTime() : v.getTime();

const toNum = (v: any): number | undefined => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

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

/* ------------------------------- component ------------------------------- */
const CalenderForScheduleItem: React.FC<CalenderProps> = ({
  initialView = "timeGridWeek",
  events,
  onDateClick,
  onEventClick,
}) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [slotStepMin, setSlotStepMin] = useState<number>(30);
  const dispatch = useDispatch();

  const ScheduleItemblocks = useSelector(
    (s: RootState) => s.ScheduleItem.scheduleItemBlocks
  );
  const selectedScreenStr = useSelector(
    (s: RootState) => s.ScheduleItem.selectedscreenId
  );
  const selectedGroupStr = useSelector(
    (s: RootState) => s.ScheduleItem.selectedgroupId
  );

  const selectedScreenId =
    selectedScreenStr != null ? Number(selectedScreenStr) : null;
  const selectedGroupId =
    selectedGroupStr != null ? Number(selectedGroupStr) : null;

  const selectedBlock = useSelector(selectSelectedBlock);
  useEffect(() => {
    console.log("[Redux:selectedBlock] ->", selectedBlock ?? null);
  }, [selectedBlock]);

  const [evts, setEvts] = useState<LocalEvt[]>(
    colorize((events ?? []).map((e, i) => ({ ...e, id: e.id ?? `seed-${i}` })))
  );

  function toDateTime(day?: string, time?: string): Date | undefined {
    if (!day || !time) return undefined;
    const d = new Date(`${day}T${time}`);
    return isNaN(d.getTime()) ? undefined : d;
  }

  const backendEvents: LocalEvt[] = useMemo(() => {
    if (!Array.isArray(ScheduleItemblocks)) return [];
    return ScheduleItemblocks.map((b) => {
      const start =
        toDateTime(b.start_day as any, b.start_time as any) ?? new Date();
      const fallbackEnd = new Date(start.getTime() + 30 * 60 * 1000);
      const end =
        toDateTime(b.end_day as any, b.end_time as any) ?? fallbackEnd;

      const title = (b as any).playlistName
        ? String((b as any).playlistName)
        : `Block #${b.id}`;

      return {
        id: `block-${b.id}`,
        title,
        start,
        end,
        allDay: false,
        extendedProps: { borderClass: DEFAULT_BORDER, isLocal: false },
      };
    });
  }, [ScheduleItemblocks]);

  const filteredBackendEvents: LocalEvt[] = useMemo(() => {
    if (selectedScreenId == null && selectedGroupId == null)
      return backendEvents;

    const matches = (b: any) => {
      const hasScreen =
        selectedScreenId == null
          ? true
          : (b.screens ?? []).some((s: any) => {
              const id = typeof s?.id === "number" ? s.id : Number(s?.id);
              return Number.isFinite(id) && id === selectedScreenId;
            });

      const hasGroup =
        selectedGroupId == null
          ? true
          : (b.groups ?? []).some((g: any) => {
              const id = typeof g?.id === "number" ? g.id : Number(g?.id);
              return Number.isFinite(id) && id === selectedGroupId;
            });

      return hasScreen && hasGroup;
    };

    const selectedBlocks = (ScheduleItemblocks ?? []).filter(matches);

    return selectedBlocks.map((b) => {
      const start =
        toDateTime(b.start_day as any, b.start_time as any) ?? new Date();
      const fallbackEnd = new Date(start.getTime() + 30 * 60 * 1000);
      const end =
        toDateTime(b.end_day as any, b.end_time as any) ?? fallbackEnd;

      const title = (b as any).playlistName
        ? String((b as any).playlistName)
        : `Block #${b.id}`;

      return {
        id: `block-${b.id}`,
        title,
        start,
        end,
        allDay: false,
        extendedProps: { borderClass: DEFAULT_BORDER, isLocal: false },
      };
    });
  }, [ScheduleItemblocks, backendEvents, selectedScreenId, selectedGroupId]);

  const finalEvents = useMemo(
    () => colorize([...(filteredBackendEvents ?? []), ...(evts ?? [])]),
    [filteredBackendEvents, evts]
  );

  const renderEvent = (content: EventContentArg) => {
    const { borderClass, isLocal } =
      (content.event.extendedProps as {
        borderClass?: string;
        isLocal?: boolean;
      }) || {};
    const stripeBg = toBg(borderClass || DEFAULT_BORDER);

    const onRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const id = content.event.id;
      setEvts((prev) => prev.filter((x) => x.id !== id));
    };

    return (
      <div
        title={`${content.event.title} • ${content.timeText}`}
        className={[
          "relative w-full h-full",
          "rounded-xl",
          "bg-white",
          "border border-neutral-200",
          "shadow-sm",
          "pl-3 pr-3 py-2",
          "text-neutral-900",
        ].join(" ")}
      >
        <div
          className={[
            "absolute left-0 top-1/2 -translate-y-1/2",
            "h-[calc(100%-10px)] w-1.5",
            "rounded-full",
            stripeBg,
          ].join(" ")}
        />
        {isLocal && (
          <button
            aria-label="Remove"
            onClick={onRemove}
            className={[
              "absolute right-1 top-1",
              "h-5 w-5",
              "flex items-center justify-center",
              "rounded-full border border-neutral-300 bg-white/90",
              "text-[11px] leading-none text-neutral-500",
              "hover:text-red-600 hover:border-red-300",
              "transition-colors",
            ].join(" ")}
          >
            ×
          </button>
        )}
        <div className="text-[11px] leading-none text-neutral-600">
          {content.timeText}
        </div>
        <div className="mt-1 line-clamp-1 text-xs font-semibold">
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
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ localId?: string }>).detail;
      if (!detail?.localId) return;
      setEvts((prev) => prev.filter((x) => x.id !== detail.localId));
    };
    window.addEventListener(
      "schedule/local-committed",
      handler as EventListener
    );
    return () => {
      window.removeEventListener(
        "schedule/local-committed",
        handler as EventListener
      );
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

  function selectedFromBackend(b: any): Block {
    return {
      id: b.id,
      playlistId: b.playlistId ?? b.playlist_id,
      playlistName: b.playlistName ?? b.playlist_name,
      start_day: String(b.start_day ?? ""),
      start_time: String(b.start_time ?? ""),
      end_day: b.end_day ? String(b.end_day) : undefined,
      end_time: b.end_time ? String(b.end_time) : undefined,
      screens: (b.screens ?? [])
        .map((s: any) => toNum(s?.id))
        .filter((n: number | undefined): n is number => n != null)
        .map((n: number) => ({ screenId: n })),
      groups: (b.groups ?? [])
        .map((g: any) => toNum(g?.id))
        .filter((n: number | undefined): n is number => n != null)
        .map((n: number) => ({ groupId: n })),
      created_at: b.created_at,
      updated_at: b.updated_at,
    };
  }

  // ✅ add optional 'extras' (e.g., { playlistId, isInteractive, durationSec })
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
      // keep the name from the list item
      playlistName: evt.title || "New Block",
      // 👇 carry the playlistId into the Block
      playlistId:
        extras?.playlistId != null ? Number(extras.playlistId) : undefined,

      start_day: fmtDay(start),
      start_time: fmtTime(start),
      end_day: fmtDay(end),
      end_time: fmtTime(end),

      // relations will be chosen in the drawer
      screens: [] as { screenId: number }[],
      groups: [] as { groupId: number }[],

      // (optional) if you want to keep these around:
      // created_at: new Date().toISOString(),
      // updated_at: new Date().toISOString(),
    };
  }

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
                    ...ext, // 👈 keep playlistId, isInteractive, durationSec, etc.
                    borderClass: DEFAULT_BORDER,
                    isLocal: true,
                  },
                };

                setEvts((prev) => colorize([...prev, localEvt]));

                setAssignOpen(true);
                dispatch(
                  setSelectedBlock(
                    // 👇 pass ext so playlistId is preserved
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
              eventClick={(arg) => {
                setAssignOpen(true);

                const id = arg.event.id;

                if (id.startsWith("block-")) {
                  // backend block (unchanged)
                  const numericId = Number(id.replace("block-", ""));
                  const raw = (ScheduleItemblocks ?? []).find((b: any) => {
                    const bid =
                      typeof b?.id === "number" ? b.id : Number(b?.id);
                    return Number.isFinite(bid) && bid === numericId;
                  });
                  if (raw) dispatch(setSelectedBlock(selectedFromBackend(raw)));
                } else {
                  // ✅ local event → include extendedProps.playlistId
                  const start = arg.event.start ?? new Date();
                  const end =
                    arg.event.end ?? new Date(start.getTime() + 30 * 60000);
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

                onEventClick?.(arg);
              }}
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

      {/* --- assign drawer (unchanged UI) --- */}
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
            <div className="h-[calc(100%-48px)] overflow-y-auto p-3 scrollbar-hide">
              <AssignSchedulebar
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

export default CalenderForScheduleItem;
