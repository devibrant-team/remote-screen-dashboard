// src/Redux/Schedule/scheduleSlice.ts
import {
  createSlice,
  nanoid,
  type PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { DateTime } from "luxon";
import type { EventInput } from "@fullcalendar/core";
import type { RootState } from "../../../store";

// ————————————————————————
// Types
// ————————————————————————
export type ScheduleBlock = {
  id: string;
  title: string;
  startDate: string; // day-first, e.g. "31-8-2025"
  endDate: string; // day-first, e.g. "31-8-2025"
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  ratio?: string;
  playlistId?: string | number;
  /** Selected screens, shape: [{ id: 1 }, { id: "abc" }] */
  screens?: Array<{ screenId: number | string }>;
  groupId?: number|string;
};

type ScheduleState = {
  blocks: ScheduleBlock[];
  timeZone: string;
};

// ————————————————————————
// Helpers
// ————————————————————————

/** Always return ISO string or throw (avoids string|null in strict TS) */
const toISOorThrow = (dt: DateTime): string => {
  const s = dt.toISO();
  if (!s) throw new Error(`Invalid DateTime: ${dt.invalidReason ?? "unknown"}`);
  return s;
};

/** "31-8-2025" | "31/08/2025" | "31.08.2025" → "2025-08-31" */
function dayFirstToISO(dateStr: string): string {
  const [d, m, y] = dateStr.split(/[-/.\s]/).map((s) => s.trim());
  const day = d.padStart(2, "0");
  const mon = m.padStart(2, "0");
  return `${y}-${mon}-${day}`;
}

const TIME_FMT = "H:mm:ss";

/** "8" → "08:00:00", "8:5" → "08:05:00", "08:00" → "08:00:00" */
function normalizeTime(t: string): string {
  if (/^\d{1,2}$/.test(t)) return t.padStart(2, "0") + ":00:00";
  if (/^\d{1,2}:\d{1,2}$/.test(t)) {
    const [hh, mm] = t.split(":");
    return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`;
  }
  if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(t)) {
    const [hh, mm, ss] = t.split(":");
    return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:${ss.padStart(
      2,
      "0"
    )}`;
  }
  return "00:00:00";
}

/** Build ISO datetime (with correct offset) from day-first date & time in a zone */
function partsToISO(dateDF: string, time: string, zone: string): string {
  const isoDate = dayFirstToISO(dateDF);
  const hhmm = normalizeTime(time);
  const dt = DateTime.fromISO(`${isoDate}T${hhmm}`, { zone });
  return toISOorThrow(dt);
}

/** Expand one block into FullCalendar events (one per day in range) */
export function expandBlockToEvents(
  b: ScheduleBlock,
  zone: string
): EventInput[] {
  const startISODate = dayFirstToISO(b.startDate);
  const endISODate = dayFirstToISO(b.endDate);
  let cur = DateTime.fromISO(startISODate, { zone }).startOf("day");
  const end = DateTime.fromISO(endISODate, { zone }).startOf("day");

  const events: EventInput[] = [];
  while (cur <= end) {
    const dayStr = cur.toFormat("yyyy-MM-dd");
    const start = DateTime.fromISO(`${dayStr}T${normalizeTime(b.startTime)}`, {
      zone,
    });
    const finish = DateTime.fromISO(`${dayStr}T${normalizeTime(b.endTime)}`, {
      zone,
    });

    events.push({
      id: `${b.id}-${dayStr}`,
      title: b.title,
      start: toISOorThrow(start),
      end: toISOorThrow(finish),
      extendedProps: {
        blockId: b.id,
        ratio: b.ratio,
        playlistId: b.playlistId,
        screens: b.screens,
        groupId: b.groupId,
      },
    });

    cur = cur.plus({ days: 1 });
  }
  return events;
}

// ————————————————————————
// Slice
// ————————————————————————
const initialState: ScheduleState = {
  blocks: [],
  timeZone: "local", // e.g., 'Asia/Beirut' | 'utc' | 'local'
};

const scheduleSlice = createSlice({
  name: "schedule",
  initialState,
  reducers: {
    /** Change the global time zone used for conversions/selectors */
    setTimeZone: (state, action: PayloadAction<string>) => {
      state.timeZone = action.payload; // e.g. 'Europe/Paris' | 'utc' | 'local'
    },

    /** Add using day-first dates and times (your preferred format) */
    addBlock: {
      prepare: (payload: Omit<ScheduleBlock, "id">) => ({
        payload: { id: nanoid(), ...payload },
      }),
      reducer: (state, action: PayloadAction<ScheduleBlock>) => {
        state.blocks.push(action.payload);
      },
    },

    /** Quick add from ISO (used by FullCalendar select/drop/resize) */
    addBlockFromISO: (
      state,
      action: PayloadAction<{
        title?: string;
        startISO: string;
        endISO: string;
        playlistId?: string | number;
        /** Selected screens from UI: [{id: 1}, {id: 5}] */
        screens?: Array<{ screenId: number | string }>;
        groupId?:  number | string ;
        /** Optional override; defaults to state.timeZone */
        zone?: string;
      }>
    ) => {
      const {
        startISO,
        endISO,
        title = "New Block",
        playlistId,
        screens,
        groupId,
        zone,
      } = action.payload;
      const useZone = zone ?? state.timeZone ?? "local";

      const s = DateTime.fromISO(startISO, { zone: useZone });
      const e = DateTime.fromISO(endISO, { zone: useZone });
      state.blocks.push({
        id: nanoid(),
        title,
        startDate: s.toFormat("d-M-yyyy"),
        endDate: e.toFormat("d-M-yyyy"),
        startTime: s.toFormat(TIME_FMT), // HH:mm:ss
        endTime: e.toFormat(TIME_FMT), // HH:mm:ss
        playlistId,
        screens,
        groupId,
      });
    },

    /** Update an existing block using ISO times (from drag/drop/resize) */
    updateBlockFromISO: (
      state,
      action: PayloadAction<{
        id: string;
        startISO: string;
        endISO: string;
        /** Optional override; defaults to state.timeZone */
        zone?: string;
      }>
    ) => {
      const { id, startISO, endISO, zone } = action.payload;
      const useZone = zone ?? state.timeZone ?? "local";

      const s = DateTime.fromISO(startISO, { zone: useZone });
      const e = DateTime.fromISO(endISO, { zone: useZone });
      const b = state.blocks.find((x) => x.id === id);
      if (b) {
        b.startDate = s.toFormat("d-M-yyyy");
        b.endDate = e.toFormat("d-M-yyyy");
        b.startTime = s.toFormat(TIME_FMT);
        b.endTime = e.toFormat(TIME_FMT);
      }
    },

    /** Update using parts (good for a form) */
    updateBlockParts: (
      state,
      action: PayloadAction<Partial<Omit<ScheduleBlock, "id">> & { id: string }>
    ) => {
      const { id, ...rest } = action.payload;
      const b = state.blocks.find((x) => x.id === id);
      if (b) Object.assign(b, rest);
    },

    removeBlock: (state, action: PayloadAction<{ id: string }>) => {
      state.blocks = state.blocks.filter((b) => b.id !== action.payload.id);
    },

    /** Replace all (optional) */
    setBlocks: (state, action: PayloadAction<ScheduleBlock[]>) => {
      state.blocks = action.payload;
    },
  },
});

export const {
  setTimeZone,
  addBlock,
  addBlockFromISO,
  updateBlockFromISO,
  updateBlockParts,
  removeBlock,
  setBlocks,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;

// ————————————————————————
// Selectors & helpers
// ————————————————————————
export const selectBlocks = (s: RootState) => s.schedule.blocks;
export const selectTimeZone = (s: RootState) => s.schedule.timeZone ?? "local";

// ✅ Memoized selector: same inputs => same array reference
export const selectCalendarEvents = createSelector(
  [selectBlocks, selectTimeZone],
  (blocks, zone) => blocks.flatMap((b) => expandBlockToEvents(b, zone))
);

/** Utility to get ISO start/end for a block (handy for previews) */
export function getBlockISO(
  b: ScheduleBlock,
  zone: string
): { startISO: string; endISO: string } {
  return {
    startISO: partsToISO(b.startDate, b.startTime, zone),
    endISO: partsToISO(b.endDate, b.endTime, zone),
  };
}
