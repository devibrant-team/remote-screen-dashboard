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

type Block = EventInput & {
  id: string;
  title: string;
  start: string;
  end: string;
  confirmed?: boolean;
  playlistId?: string | number;
  ratio?: string;
};

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd;

export default function Calender() {
  const calRef = useRef<FullCalendar | null>(null);
  const dropLock = useRef<Set<string>>(new Set());

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // step controls
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

  // add block (supports playlistId/title)
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
    setBlocks((prev) => [
      ...prev,
      {
        id,
        title: extra.title ?? "Unnamed",
        start: startISO,
        end: endISO,
        ratio: "16:9",
        confirmed,
        playlistId: extra.playlistId,
      },
    ]);
  };

  const updateBlockTime = (id: string, startISO: string, endISO: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, start: startISO, end: endISO } : b
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

  const onEventClick = (info: EventClickArg) => {
    setEditingId(info.event.id);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
  };

  const saveName = (newName: string) => {
    if (!editingId) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === editingId ? { ...b, title: newName } : b))
    );
    closeModal();
  };

  const editingBlock = editingId
    ? blocks.find((b) => b.id === editingId)
    : undefined;

  // Make the sidebar list draggable for FullCalendar
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
        timeZone="Asia/Beirut"
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
        /* ✅ Only create via dragging from sidebar */
        droppable={true}
        /* ✅ Allow moving/resizing existing events, forbid overlaps */
        editable
        eventOverlap={false}
        eventAllow={(dropInfo, draggedEvent) => {
          const hit = findOverlap(
            dropInfo.start,
            dropInfo.end,
            draggedEvent?.id as string | undefined
          );
          return !hit;
        }}
        /* ✅ Receive external drops and persist to state */
        eventReceive={(info: EventReceiveArg) => {
          const ev = info.event;

          // align to grid
          const start = floorToStep(ev.start!);
          const durationSec = Number(ev.extendedProps?.durationSec || 0);
          const durMs =
            (durationSec > 0 ? durationSec : stepMinutes * 60) * 1000;
          const end = ceilToStep(new Date(start.getTime() + durMs));

          // 🔒 de-dupe guard (prevents the "dropped twice" race)
          const key = `${start.toISOString()}|${end.toISOString()}`;
          if (dropLock.current.has(key)) {
            ev.remove();
            return;
          }
          dropLock.current.add(key);

          // ✅ atomic add: prevents overlaps/dupes even if React state hasn't flushed yet
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
                ratio: "16:9",
                confirmed: true,
                playlistId: ev.extendedProps?.playlistId as
                  | string
                  | number
                  | undefined,
              },
            ];
          });

          // remove FC's temp event
          ev.remove();

          // release lock next tick
          setTimeout(() => dropLock.current.delete(key), 0);
        }}
        /* ✅ Edit existing bookings */
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
        /* UI for each event card */
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
        /* Data */
        events={blocks}
      />

      <ScheduleModel
        open={isOpen}
        initialName={editingBlock?.title ?? "Unnamed Block"}
        onSave={saveName}
        onClose={closeModal}
      />
    </div>
  );
}
