// CalenderForScheduleItem.tsx
import React, { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
} from "@fullcalendar/core";
import type {
  DateClickArg,
  EventResizeDoneArg,
} from "@fullcalendar/interaction";

type CalenderProps = {
  initialView?: "timeGridWeek" | "timeGridDay" | "dayGridMonth";
  events?: Array<{
    id?: string;
    title: string;
    start: string | Date;
    end?: string | Date;
    allDay?: boolean;
    /** optional color class like "border-red-600" to control stripe */
    extendedProps?: { borderClass?: string };
  }>;
  onDateClick?: (arg: DateClickArg) => void;
  onEventClick?: (arg: EventClickArg) => void;
};

/* -------------------------------- helpers -------------------------------- */

type LocalEvt = {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  extendedProps?: { borderClass?: string };
};

const DEFAULT_BORDER = "border-red-600";

const toTs = (v?: Date | string | null) =>
  !v ? Number.NaN : typeof v === "string" ? new Date(v).getTime() : v.getTime();

/** sort + ensure every event has a color */
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
    },
  }));
}

/** "border-red-600" → "bg-red-600" */
const toBg = (cls?: string) =>
  cls && cls.startsWith("border-")
    ? cls.replace("border-", "bg-")
    : cls ?? "bg-red-600";

let uid = 1;
const newId = () => `e${uid++}`;

/* ------------------------------- component ------------------------------- */

const CalenderForScheduleItem: React.FC<CalenderProps> = ({
  initialView = "timeGridWeek",
  events,
  onDateClick,
  onEventClick,
}) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [weekends, setWeekends] = useState(true);

  const [evts, setEvts] = useState<LocalEvt[]>(
    colorize((events ?? []).map((e, i) => ({ ...e, id: e.id ?? `seed-${i}` })))
  );
  const data = useMemo(() => colorize(evts), [evts]);

  // Create by drag-select
  const handleSelect = (sel: DateSelectArg) => {
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
      extendedProps: { borderClass: DEFAULT_BORDER },
    };
    setEvts((prev) => colorize([...prev, block]));
    sel.view.calendar.unselect();
  };

  // Create by single click (30 min)
  const handleDateClick = (arg: DateClickArg) => {
    const start = arg.date;
    const end = new Date(start.getTime() + 30 * 60000);
    const block: LocalEvt = {
      id: newId(),
      title: "New Block",
      start,
      end,
      allDay: false,
      extendedProps: { borderClass: DEFAULT_BORDER },
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

  const handleEventResize = (arg: EventResizeDoneArg) => {
    const id = arg.event.id;
    const start = arg.event.start!;
    const end = arg.event.end!;
    setEvts((prev) =>
      colorize(prev.map((e) => (e.id === id ? { ...e, start, end } : e)))
    );
  };

  /* --------------------------- unified white-with-red-stripe --------------------------- */
  const renderEvent = (content: EventContentArg) => {
    const borderClass =
      (content.event.extendedProps as { borderClass?: string })?.borderClass ||
      DEFAULT_BORDER;
    const stripeBg = toBg(borderClass);

    return (
      <div
        title={`${content.event.title} • ${content.timeText}`}
        className={[
          "relative w-full h-full",
          "rounded-xl",
          "bg-white",
          "border border-neutral-200",
          "shadow-sm",
          "pl-3 pr-3 py-2", // space for stripe + text padding
          "text-neutral-900",
        ].join(" ")}
      >
        {/* left stripe */}
        <div
          className={[
            "absolute left-0 top-1/2 -translate-y-1/2",
            "h-[calc(100%-10px)] w-1.5",
            "rounded-full",
            stripeBg,
          ].join(" ")}
        />
        {/* content (top-left) */}
        <div className="text-[11px] leading-none text-neutral-600">
          {content.timeText}
        </div>
        <div className="mt-1 line-clamp-1 text-xs font-semibold">
          {content.event.title}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-lg font-semibold text-neutral-800">Calendar</h2>
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

            <label className="ml-2 flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={weekends}
                onChange={(e) => setWeekends(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              Weekends
            </label>
          </div>
        </div>

        {/* Calendar */}
        <div className="p-2 md:p-4 fat-slots">
          <FullCalendar
            ref={calendarRef as any}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={initialView}
            headerToolbar={false}
            height="auto"
            contentHeight="auto"
            expandRows
            dayMaxEvents={false}
            weekends={weekends}
            nowIndicator
            selectable
            selectMirror
            selectOverlap
            unselectAuto
            selectLongPressDelay={50}
            defaultTimedEventDuration="00:30:00"
            slotDuration="00:30:00"
            selectMinDistance={8}
            editable
            eventOverlap={false}
            eventDisplay="block"
            events={data}
            allDaySlot={false}
            dateClick={handleDateClick}
            eventClick={(arg) => onEventClick?.(arg)}
            select={handleSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventContent={renderEvent}
            stickyHeaderDates
            windowResizeDelay={50}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00" // covers 00:00..23:59
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
            /* Let our custom white box render without FC coloring over it */
            eventBackgroundColor="transparent"
            eventBorderColor="transparent"
            eventTextColor="inherit"
            /* No extra FC styling padding/borders */
            eventClassNames={() => ["overflow-visible", "px-0", "py-0"]}
          />
        </div>
      </div>
    </div>
  );
};

export default CalenderForScheduleItem;
