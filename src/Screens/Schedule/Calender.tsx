import { useRef, useState, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import type {
  EventInput,
  EventClickArg,
  EventDropArg,
} from "@fullcalendar/core";
import type {
  EventResizeDoneArg,
  EventReceiveArg,
} from "@fullcalendar/interaction";

import {
  addBlockFromISO,
  updateBlockFromISO,
  removeBlock,
  selectCalendarEvents,
  selectBlocks,
} from "../../Redux/Schedule/SheduleSlice";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import ScheduleModel from "../../Components/Models/ScheduleModel";

/** ---------- Utils ---------- */
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd;

function hasOverlap(
  events: EventInput[],
  start: Date,
  end: Date,
  exceptEventId?: string | null
) {
  return events.some((ev) => {
    if (!ev.start || !ev.end) return false;
    if (exceptEventId && ev.id === exceptEventId) return false;
    const s = new Date(ev.start as string);
    const e = new Date(ev.end as string);
    return overlaps(start, end, s, e);
  });
}

export default function Calender() {
  const dispatch = useDispatch();
  const calRef = useRef<FullCalendar | null>(null);
  const events = useSelector(selectCalendarEvents); // memoized, no warning

  const savedBlocks = useSelector(selectBlocks, shallowEqual);
  // ⬇️ modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedEvent, setClickedEvent] = useState<{
    id: string;
    title: string;
    blockId?: string;
  } | null>(null);

  useEffect(() => {
    console.log("[schedule.blocks]", savedBlocks);
  }, [savedBlocks]);

  // grid step UI (local to component)
  const [stepMinutes, setStepMinutes] = useState<number>(10);
  const [customStep, setCustomStep] = useState<string>("");

  const stepMs = stepMinutes * 60_000;
  const floorToStep = (d: Date) =>
    new Date(Math.floor(d.getTime() / stepMs) * stepMs);
  const ceilToStep = (d: Date) =>
    new Date(Math.ceil(d.getTime() / stepMs) * stepMs);

  const stepHMS = useMemo(() => {
    const m = Math.max(1, Math.floor(stepMinutes));
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}:00`;
  }, [stepMinutes]);

  /** ---------- Make external lists draggable ---------- */
  useEffect(() => {
    const make = (listId: string, fallbackTitle: string) => {
      const el = document.getElementById(listId);
      if (!el) return null;
      return new Draggable(el, {
        itemSelector: "li[data-playlist-id]",
        eventData: (liEl) => {
          const title =
            liEl.getAttribute("data-title") || fallbackTitle || "Playlist";
          const pid = liEl.getAttribute("data-playlist-id") || "";
          const durationSec = Number(liEl.getAttribute("data-duration") || 0);
          return {
            title,
            duration: {
              seconds: durationSec > 0 ? durationSec : stepMinutes * 60,
            },
            extendedProps: { playlistId: pid, durationSec },
          };
        },
      });
    };

    const d1 = make("normal-playlist-list", "Playlist");
    const d2 = make("interactive-playlist-list", "Interactive Playlist");
    return () => {
      d1?.destroy();
      d2?.destroy();
    };
  }, [stepMinutes]);

  return (
    <div className="w-full min-h-screen rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      {/* Step control */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-black">Step:</span>

        <div className="ml-2 flex items-center gap-1">
          <input
            type="number"
            min={1}
            placeholder="Custom (min)"
            className="w-28 rounded-md border border-neutral-300 px-2 py-1 text-black"
            value={customStep}
            onChange={(e) => setCustomStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = Number(customStep);
                if (Number.isFinite(n) && n >= 1) setStepMinutes(Math.floor(n));
              }
            }}
          />
          {[5, 10, 15].map((m) => (
            <button
              key={m}
              onClick={() => setStepMinutes(m)}
              className={[
                "rounded-md border px-2 py-1",
                stepMinutes === m
                  ? "border-red-700 bg-red-500 text-white"
                  : "border-red-500 bg-white text-black hover:bg-red-500 hover:text-white",
              ].join(" ")}
            >
              {m}m
            </button>
          ))}
          <button
            onClick={() => {
              const n = Number(customStep);
              if (Number.isFinite(n) && n >= 1) setStepMinutes(Math.floor(n));
            }}
            className="rounded-md border border-red-500 bg-white px-2 py-1 text-black hover:bg-red-500 hover:text-white"
          >
            Set
          </button>
          <span className="ml-2 text-black/60">Current: {stepMinutes}m</span>
        </div>
      </div>

      <FullCalendar
        ref={calRef as any}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        timeZone="local"
        allDaySlot={false}
        nowIndicator
        expandRows
        eventColor="#ef4444"
        eventTextColor="#ffffff"
        height="100%"
        contentHeight="auto"
        slotDuration={stepHMS}
        snapDuration={stepHMS}
        slotLabelInterval="01:00:00"
        slotLabelFormat={{ hour: "numeric", hour12: false }}
        slotMinTime="08:00:00"
        slotMaxTime="23:00:00"
        scrollTime="08:00:00"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek",
        }}
        validRange={{
          start: new Date().toISOString().split("T")[0],
        }}
        droppable
        editable
        eventOverlap={false}
        // Prevent overlaps against current rendered events
        eventAllow={(dropInfo, draggedEvent) => {
          const start = dropInfo.start;
          const end = dropInfo.end;
          const exceptId = draggedEvent?.id ?? null;
          return !hasOverlap(events, start, end, exceptId);
        }}
        // External item dropped onto calendar
        eventReceive={(info: EventReceiveArg) => {
          const ev = info.event;
          const start = floorToStep(ev.start!);
          const durationSec = Number(ev.extendedProps?.durationSec || 0);
          const end =
            durationSec > 0
              ? new Date(start.getTime() + durationSec * 1000)
              : ceilToStep(new Date(start.getTime() + stepMinutes * 60 * 1000));

          // guard overlaps
          if (hasOverlap(events, start, end, null)) {
            ev.remove();
            return;
          }

          dispatch(
            addBlockFromISO({
              title: ev.title || "Playlist",
              startISO: start.toISOString(),
              endISO: end.toISOString(),
              playlistId: ev.extendedProps?.playlistId as
                | string
                | number
                | undefined,
            })
          );

          // prevent “ghost” temp event
          ev.remove();
        }}
        // Drag existing event
        eventDrop={(info: EventDropArg) => {
          const blockId = info.event.extendedProps?.blockId as
            | string
            | undefined;
          if (!blockId) {
            info.revert();
            return;
          }

          const start = info.event.start!;
          const end = info.event.end!;
          // prevent overlaps
          if (hasOverlap(events, start, end, info.event.id)) {
            info.revert();
            return;
          }

          dispatch(
            updateBlockFromISO({
              id: blockId,
              startISO: start.toISOString(),
              endISO: end.toISOString(),
              // zone omitted => "local"
            })
          );
        }}
        // Resize existing event
        eventResize={(info: EventResizeDoneArg) => {
          const blockId = info.event.extendedProps?.blockId as
            | string
            | undefined;
          if (!blockId) {
            info.revert();
            return;
          }

          const start = info.event.start!;
          const end = info.event.end!;
          if (hasOverlap(events, start, end, info.event.id)) {
            info.revert();
            return;
          }

          dispatch(
            updateBlockFromISO({
              id: blockId,
              startISO: start.toISOString(),
              endISO: end.toISOString(),
            })
          );
        }}
        // ⬇️ Open the modal when a block is clicked
        eventClick={(info: EventClickArg) => {
          const blockId = info.event.extendedProps?.blockId as
            | string
            | undefined;
          setClickedEvent({
            id: info.event.id,
            title: info.event.title || "",
            blockId,
          });
          setIsModalOpen(true);
        }}
        // Render + inline delete button
        eventContent={(arg) => {
          const blockId = arg.event.extendedProps?.blockId as
            | string
            | undefined;
          const screensCount = Array.isArray(arg.event.extendedProps?.screens)
            ? arg.event.extendedProps.screens.length
            : 0;

          // if you store a single primitive groupId (number|string)
          const groupCount =
            arg.event.extendedProps?.groupId !== undefined &&
            arg.event.extendedProps?.groupId !== null
              ? 1
              : 0;
          return (
            <div className="ev-wrap relative h-full w-full px-1 py-0.5">
              <button
                className="ev-x-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (blockId) dispatch(removeBlock({ id: blockId }));
                }}
                aria-label="Remove block"
                title="Remove block"
              >
                ×
              </button>

              <div className="ev-card ev-confirmed">
                {arg.timeText && <div className="ev-time">{arg.timeText}</div>}
                <div className="ev-title">{arg.event.title}</div>
                <div className="ev-meta font-bold">
                  Groups: {groupCount} ,Screens:{" "}
                  {screensCount}
                </div>
              </div>
            </div>
          );
        }}
        // Tweak font sizing based on available height (unchanged)
        eventDidMount={(info) => {
          const wrap = info.el.querySelector(".ev-wrap") as HTMLElement | null;
          const card = info.el.querySelector(".ev-card") as HTMLElement | null;
          if (!wrap || !card) return;

          const h = card.clientHeight;
          let fs = 12;
          let lines = 2;

          wrap.classList.remove("ev-tiny", "ev-compact", "no-x");

          if (h < 18) {
            wrap.classList.add("ev-tiny", "no-x");
            fs = 9;
            lines = 1;
          } else if (h < 28) {
            wrap.classList.add("ev-compact");
            fs = 10;
            lines = 1;
          } else if (h > 56) {
            fs = 14;
            lines = 3;
          }

          card.style.setProperty("--ev-fs", `${fs}px`);
          card.style.setProperty("--ev-lines", `${lines}`);
        }}
        // ← Render Redux-derived events
        events={events}
      />

      {/* Simple modal for ScheduleModel */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">
                {clickedEvent?.title || "Schedule"}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50"
              >
                Close
              </button>
            </div>

            <ScheduleModel
              blockId={clickedEvent?.blockId}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
