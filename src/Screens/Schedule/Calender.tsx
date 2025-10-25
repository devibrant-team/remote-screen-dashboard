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
  setSelectedBlockId,
  clearSelectedBlockId,
  selectSelectedBlockId,
} from "../../Redux/Schedule/SheduleSlice";

import { shallowEqual, useDispatch, useSelector } from "react-redux";
import ScheduleModel from "../../Components/Models/ScheduleModel";
import { useStep } from "../../Hook/Schedule/StepContext";
import { nanoid } from "@reduxjs/toolkit";

/* ----------------------------------
   Helpers
-----------------------------------*/

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd;

/**
 * Check if [start,end] hits any existing event.
 * If exceptEventId is passed, we ignore that event (for drag/resize of itself).
 */
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

  // merged events from Redux (editable red + readonly gray)
  const events = useSelector(selectCalendarEvents);

  // just your local user's draft blocks (used for debug)
  const savedBlocks = useSelector(selectBlocks, shallowEqual);

  // which block is currently "selected" in the drawer
  const selectedBlockId = useSelector(selectSelectedBlockId);

  // side drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedEvent, setClickedEvent] = useState<{
    id: string;
    title: string;
    blockId?: string;
  } | null>(null);

  useEffect(() => {
    console.log("[schedule.blocks]", savedBlocks);
  }, [savedBlocks]);

  // step size (like 15 min / 30 min / etc.) from your StepContext
  const { stepMinutes } = useStep();
  const stepMs = stepMinutes * 60_000;

  const floorToStep = (d: Date) =>
    new Date(Math.floor(d.getTime() / stepMs) * stepMs);

  const ceilToStep = (d: Date) =>
    new Date(Math.ceil(d.getTime() / stepMs) * stepMs);

  // FullCalendar slotDuration & snapDuration expect "HH:mm:ss"
  const stepHMS = useMemo(() => {
    const m = Math.max(1, Math.floor(stepMinutes));
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}:00`; // e.g. "00:15:00"
  }, [stepMinutes]);

  /* ----------------------------------
     Make external playlist items draggable
  -----------------------------------*/
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
            extendedProps: {
              playlistId: pid,
              durationSec,
              // VERY IMPORTANT:
              // playlists dragged in are editable, not readonly
              readonly: false,
            },
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

  /* ----------------------------------
     Calendar render
  -----------------------------------*/
  return (
    <div className="w-full min-h-screen rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <FullCalendar
        ref={calRef as any}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        timeZone="local"
        allDaySlot={false}
        nowIndicator
        expandRows
        height="100%"
        contentHeight="auto"
        eventTextColor="#ffffff"
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
        /* ----------------------------------
           Can I drop/drag this here?
        -----------------------------------*/
        eventAllow={(dropInfo, draggedEvent) => {
          // if this is a readonly (gray) event, block it from moving
          if (draggedEvent?.extendedProps?.readonly) return false;

          const start = dropInfo.start;
          const end = dropInfo.end;
          const exceptId = draggedEvent?.id ?? null;

          // block dropping on top of *any* occupied slot (red or gray)
          return !hasOverlap(events, start, end, exceptId);
        }}
        /* ----------------------------------
           External playlist dropped on calendar
        -----------------------------------*/
        eventReceive={(info: EventReceiveArg) => {
          const ev = info.event;

          // we snap start time to the step grid
          const start = floorToStep(ev.start!);

          const durationSec = Number(ev.extendedProps?.durationSec || 0);
          const end =
            durationSec > 0
              ? new Date(start.getTime() + durationSec * 1000)
              : ceilToStep(
                  new Date(start.getTime() + stepMinutes * 60 * 1000)
                );

          // reject if it collides with anything (including busy gray)
          if (hasOverlap(events, start, end, null)) {
            ev.remove();
            return;
          }

          // make a new local block in Redux
          const newId = nanoid();
          dispatch(
            addBlockFromISO({
              idOverride: newId,
              title: ev.title || "Playlist",
              startISO: start.toISOString(),
              endISO: end.toISOString(),
              playlistId: ev.extendedProps?.playlistId as
                | string
                | number
                | undefined,
              // screens / groups will be chosen in the drawer
              // so we don't attach them yet
            })
          );

          // immediately open drawer for that new block
          dispatch(setSelectedBlockId(newId));
          setClickedEvent({
            id: `${newId}-${start.toISOString().slice(0, 10)}`,
            title: ev.title || "Playlist",
            blockId: newId,
          });
          setIsModalOpen(true);

          // remove the "ghost" HalfCalendar event that FullCalendar created
          ev.remove();
        }}
        /* ----------------------------------
           User drags an existing calendar event to a new time
        -----------------------------------*/
        eventDrop={(info: EventDropArg) => {
          // don't allow dragging readonly gray blocks
          if (info.event.extendedProps?.readonly) {
            info.revert();
            return;
          }

          const blockId = info.event.extendedProps?.blockId as
            | string
            | undefined;
          if (!blockId) {
            info.revert();
            return;
          }

          const start = info.event.start!;
          const end = info.event.end!;

          // don't allow overlaps with anything else
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
        /* ----------------------------------
           User resizes an existing calendar event
        -----------------------------------*/
        eventResize={(info: EventResizeDoneArg) => {
          // don't allow resizing readonly gray blocks
          if (info.event.extendedProps?.readonly) {
            info.revert();
            return;
          }

          const blockId = info.event.extendedProps?.blockId as
            | string
            | undefined;
          if (!blockId) {
            info.revert();
            return;
          }

          const start = info.event.start!;
          const end = info.event.end!;

          // don't allow overlaps with anything else
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
        /* ----------------------------------
           Click event: open drawer (if editable)
        -----------------------------------*/
        eventClick={(info: EventClickArg) => {
          // If it's readonly gray -> do nothing
          if (info.event.extendedProps?.readonly) {
            return;
          }

          const blockId = info.event.extendedProps?.blockId as
            | string
            | undefined;

          if (blockId) {
            dispatch(setSelectedBlockId(blockId));
          } else {
            dispatch(clearSelectedBlockId());
          }

          setClickedEvent({
            id: info.event.id,
            title: info.event.title || "",
            blockId,
          });
          setIsModalOpen(true);
        }}
        /* ----------------------------------
           Add class names for "selected"
        -----------------------------------*/
        eventClassNames={(arg) => {
          // gray events get their own style anyway,
          // but we still outline red events if selected
          const isSelected =
            arg.event.extendedProps?.blockId === selectedBlockId &&
            !arg.event.extendedProps?.readonly;

          return isSelected
            ? ["ring-2", "ring-red-400", "ring-offset-2"]
            : [];
        }}
        /* ----------------------------------
           Custom render for each block
        -----------------------------------*/
        eventContent={(arg) => {
          const readonly = !!arg.event.extendedProps?.readonly;

          const blockId = arg.event.extendedProps?.blockId as
            | string
            | undefined;

          // screens can be an array of {screenId:...}
          const screensCount = Array.isArray(arg.event.extendedProps?.screens)
            ? arg.event.extendedProps.screens.length
            : 0;

          // groups can be an array of {groupId:...}
          const groupCount = Array.isArray(arg.event.extendedProps?.groups)
            ? arg.event.extendedProps.groups.length
            : 0;

          // selected if it's not readonly and matches selectedBlockId
          const selected =
            !readonly && blockId && blockId === selectedBlockId;

          // card base style:
          // - red for editable
          // - gray for readonly
          const cardClasses = [
            "ev-card",
            readonly
              ? "bg-gray-300 text-gray-800 border border-gray-400"
              : "ev-confirmed bg-red-500 text-white",
            selected
              ? "ring-2 ring-white/70 outline-2 outline-red-400"
              : "",
          ].join(" ");

          return (
            <div className="ev-wrap relative h-full w-full px-1 py-0.5">
              {/* X delete button only for editable (red) */}
              {!readonly && (
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
              )}

              <div className={cardClasses}>
                {arg.timeText && (
                  <div className="ev-time text-[10px] leading-tight opacity-80">
                    {arg.timeText}
                  </div>
                )}

                <div className="ev-title text-[11px] font-semibold leading-snug line-clamp-2">
                  {arg.event.title}
                </div>

                <div className="ev-meta mt-1 text-[10px] leading-tight font-medium">
                  {readonly ? "Existing schedule" : ""}
                  <br />
                  Groups: {groupCount} , Screens: {screensCount}
                </div>
              </div>
            </div>
          );
        }}
        /* ----------------------------------
           Dynamic font-size tweak based on event height
        -----------------------------------*/
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

          // let CSS know how big to draw text
          card.style.setProperty("--ev-fs", `${fs}px`);
          card.style.setProperty("--ev-lines", `${lines}`);
        }}
        /* ----------------------------------
           FINALLY inject all events
        -----------------------------------*/
        events={events}
      />

      {/* Side drawer modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          aria-labelledby="schedule-drawer-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsModalOpen(false);
              dispatch(clearSelectedBlockId());
            }}
          />

          {/* Drawer panel */}
          <aside
            className={[
              "pointer-events-auto fixed right-0 top-0 h-full w-full max-w-xl",
              "bg-white shadow-2xl",
              "transition-transform duration-300 ease-out",
              "translate-x-0",
            ].join(" ")}
          >
            {/* Drawer header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60">
              <div
                className="text-lg font-semibold"
                id="schedule-drawer-title"
              >
                {clickedEvent?.title || "Schedule"}
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  dispatch(clearSelectedBlockId());
                }}
                className="rounded-md border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50"
                autoFocus
              >
                Close
              </button>
            </div>

            {/* Drawer body */}
            <div className="h-[calc(100%-52px)] overflow-y-auto p-4">
              <ScheduleModel
                blockId={clickedEvent?.blockId}
                onClose={() => {
                  setIsModalOpen(false);
                  dispatch(clearSelectedBlockId());
                }}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
