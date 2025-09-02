// src/Screens/Schedule/Calender.tsx
import { useRef, useState, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import type {
  EventResizeDoneArg,
  EventReceiveArg,
} from "@fullcalendar/interaction";
import type {
  EventDropArg,
  EventInput,
  EventClickArg,
} from "@fullcalendar/core";
import ScheduleModel from "../../Components/Models/ScheduleModel";

/** ---------- Types ---------- */
type Block = EventInput & {
  id: string;
  title: string;
  start: string;
  end: string;
  StartDate: string;
  StartTime: string;
  EndDate: string;
  EndTime: string;

  confirmed?: boolean;
  playlistId?: string | number;
  ratio?: string;
};

/** ---------- Utils ---------- */
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd;

const TZ = "Asia/Beirut";

const toUIParts = (iso: string) => {
  const [datePart, timeWithMs] = iso.split("T");
  const timePart = timeWithMs.split(".")[0];
  return {
    dateStr: datePart,
    timeStr: timePart,
  };
};

export default function Calender() {
  const calRef = useRef<FullCalendar | null>(null);
  const dropLock = useRef<Set<string>>(new Set());

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  console.log(blocks);
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

  const addBlock = (
    startISO: string,
    endISO: string,
    confirmed = true,
    extra: Partial<Block> = {}
  ) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Math.random());
    const { dateStr: StartDate, timeStr: StartTime } = toUIParts(startISO);
    const { dateStr: EndDate, timeStr: EndTime } = toUIParts(endISO);

    setBlocks((prev) => [
      ...prev,
      {
        id,
        title: extra.title ?? "Unnamed",
        start: startISO,
        end: endISO,
        StartDate,
        StartTime,
        EndDate,
        EndTime,
        confirmed,
        playlistId: extra.playlistId,
      },
    ]);
  };

  const updateBlockTime = (id: string, startISO: string, endISO: string) => {
    const { dateStr: StartDate, timeStr: StartTime } = toUIParts(startISO);
    const { dateStr: EndDate, timeStr: EndTime } = toUIParts(endISO);

    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              start: startISO,
              end: endISO,
              StartDate,
              StartTime,
              EndDate,
              EndTime,
            }
          : b
      )
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const findOverlap = (start: Date, end: Date, exceptId?: string) =>
    blocks.find((b) => {
      if (b.id === exceptId) return false;
      const bs = new Date(b.start as string);
      const be = new Date(b.end as string);
      return overlaps(start, end, bs, be);
    });

  /** ---------- Modal handlers ---------- */
  const onEventClick = (info: EventClickArg) => {
    setEditingId(info.event.id);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
  };

  const editingBlock = editingId
    ? blocks.find((b) => b.id === editingId)
    : undefined;

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
        timeZone={TZ}
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
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
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
        eventAllow={(dropInfo, draggedEvent) => {
          // Block if the start is before today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dropInfo.start < today) return false;

          // Keep your overlap check
          const hit = findOverlap(
            dropInfo.start,
            dropInfo.end,
            draggedEvent?.id as string | undefined
          );
          return !hit;
        }}
        eventReceive={(info: EventReceiveArg) => {
          const ev = info.event;
          const start = floorToStep(ev.start!);
          const durationSec = Number(ev.extendedProps?.durationSec || 0);
          let end: Date;

          if (durationSec > 0) {
            // exact playlist duration in seconds → don’t round
            end = new Date(start.getTime() + durationSec * 1000);
          } else {
            // fallback: round to step
            end = ceilToStep(
              new Date(start.getTime() + stepMinutes * 60 * 1000)
            );
          }

          const key = `${start.toISOString()}|${end.toISOString()}`;
          if (dropLock.current.has(key)) {
            ev.remove();
            return;
          }
          dropLock.current.add(key);

          const { dateStr: StartDate, timeStr: StartTime } = toUIParts(
            start.toISOString()
          );
          const { dateStr: EndDate, timeStr: EndTime } = toUIParts(
            end.toISOString()
          );

          setBlocks((prev) => {
            const hasConflict = prev.some((b) =>
              overlaps(
                start,
                end,
                new Date(b.start as string),
                new Date(b.end as string)
              )
            );
            if (hasConflict) return prev;

            const id =
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : String(Math.random());

            return [
              ...prev,
              {
                id,
                title: ev.title || "Playlist",
                start: start.toISOString(),
                end: end.toISOString(),
                StartDate,
                StartTime,
                EndDate,
                EndTime,
                ratio: "16:9",
                confirmed: true,
                playlistId: ev.extendedProps?.playlistId as
                  | string
                  | number
                  | undefined,
              },
            ];
          });

          ev.remove();
          setTimeout(() => dropLock.current.delete(key), 0);
        }}
        eventDrop={(info: EventDropArg) =>
          updateBlockTime(
            info.event.id,
            info.event.startStr!,
            info.event.endStr!
          )
        }
        eventResize={(info: EventResizeDoneArg) =>
          updateBlockTime(
            info.event.id,
            info.event.startStr!,
            info.event.endStr!
          )
        }
        eventClick={onEventClick}
        eventContent={(arg) => {
          const { id } = arg.event;
          const confirmed =
            (arg.event.extendedProps?.confirmed as boolean) ?? true;
          const ratio = arg.event.extendedProps?.ratio as string | undefined;

          return (
            <div
              className="ev-wrap relative h-full w-full px-1 py-0.5"
              title={`${arg.timeText ?? ""} — ${arg.event.title}${
                ratio ? ` • ${ratio}` : ""
              }`}
            >
              <button
                className="ev-x-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeBlock(id);
                }}
                aria-label="Remove block"
                title="Remove block"
              >
                ×
              </button>

              <div
                className={`ev-card ${
                  confirmed ? "ev-confirmed" : "ev-pending"
                }`}
              >
                {arg.timeText && <div className="ev-time">{arg.timeText}</div>}
                <div className="ev-title">{arg.event.title}</div>
                {ratio && <div className="ev-meta">Ratio {ratio}</div>}
              </div>
            </div>
          );
        }}
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
        events={blocks}
      />

      <ScheduleModel
        open={isOpen}
        initialName={editingBlock?.title ?? "Unnamed Block"}
        onSave={(name) =>
          setBlocks((prev) =>
            prev.map((b) => (b.id === editingId ? { ...b, title: name } : b))
          )
        }
        onClose={closeModal}
      />
    </div>
  );
}
