import {
  createSlice,
  nanoid,
  type PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { DateTime } from "luxon";
import type { EventInput } from "@fullcalendar/core";
import type { RootState } from "../../../store";

/* ---------------- Types ---------------- */

export type ScheduleBlock = {
  id: string | number;
  title: string;
  startDate: string; // "25-10-2025"  (dd-MM-yyyy)
  endDate: string;
  startTime: string; // "08:00:00"
  endTime: string;   // "09:00:00"
  ratio?: string;
  playlistId?: string | number;

  // ---- these two are now ARRAYS ----
  screens?: Array<{ screenId: number | string }>;
  groups?: Array<{ groupId: number | string }>;
};

type ScheduleState = {
  blocks: ScheduleBlock[];          // <- your editable red blocks
  reservedBlocks: ScheduleBlock[];  // <- readonly gray blocks from server
  timeZone: string;
  selectedBlockId: string | null;
};

/* ---------------- helpers from your file (unchanged) ---------------- */

const toISOorThrow = (dt: DateTime): string => {
  const s = dt.toISO();
  if (!s) throw new Error("Invalid DateTime");
  return s;
};

function dayFirstToISO(dateStr: string): string {
  const [d, m, y] = dateStr.split(/[-/.\s]/).map((s) => s.trim());
  const day = d.padStart(2, "0");
  const mon = m.padStart(2, "0");
  return `${y}-${mon}-${day}`;
}

const TIME_FMT = "HH:mm:ss";

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

function partsToISO(dateDF: string, time: string, zone: string): string {
  const isoDate = dayFirstToISO(dateDF);
  const hhmm = normalizeTime(time);
  const dt = DateTime.fromISO(`${isoDate}T${hhmm}`, { zone });
  return toISOorThrow(dt);
}

/**
 * Expand block over each day between startDate..endDate and return
 * FullCalendar EventInput objects.
 *
 * `readonly` param lets us mark reserved blocks as non-editable + gray.
 */
export function expandBlockToEvents(
  b: ScheduleBlock,
  zone: string,
  readonly = false
): EventInput[] {
  const startISODate = dayFirstToISO(b.startDate);
  const endISODate = dayFirstToISO(b.endDate);

  let cur = DateTime.fromISO(startISODate, { zone }).startOf("day");
  const end = DateTime.fromISO(endISODate, { zone }).startOf("day");

  const events: EventInput[] = [];
  while (cur <= end) {
    const dayStr = cur.toFormat("yyyy-MM-dd");

    const start = DateTime.fromISO(
      `${dayStr}T${normalizeTime(b.startTime)}`,
      { zone }
    );
    const finish = DateTime.fromISO(
      `${dayStr}T${normalizeTime(b.endTime)}`,
      { zone }
    );

    events.push({
      id: `${b.id}-${dayStr}`, // unique per day
      title: b.title,
      start: toISOorThrow(start),
      end: toISOorThrow(finish),
      // ⬇⬇ what FullCalendar will get on .event.extendedProps
      extendedProps: {
        blockId: readonly ? undefined : String(b.id), // only editable events expose blockId
        readonly, // <-- important
        ratio: b.ratio,
        playlistId: b.playlistId,
        screens: b.screens ?? [],
        groups: b.groups ?? [],
      },
    });

    cur = cur.plus({ days: 1 });
  }

  return events;
}

/* ---------------- initial state ---------------- */

const initialState: ScheduleState = {
  blocks: [],
  reservedBlocks: [], // start empty
  timeZone: "local",
  selectedBlockId: null,
};

/* ---------------- slice ---------------- */

const scheduleSlice = createSlice({
  name: "schedule",
  initialState,
  reducers: {
    setTimeZone: (state, action: PayloadAction<string>) => {
      state.timeZone = action.payload;
    },

    // create a new editable block
    addBlock: {
      prepare: (payload: Omit<ScheduleBlock, "id">) => ({
        payload: { id: nanoid(), ...payload },
      }),
      reducer: (state, action: PayloadAction<ScheduleBlock>) => {
        state.blocks.push(action.payload);
      },
    },

    // quick add (drag from playlist)
    addBlockFromISO: (
      state,
      action: PayloadAction<{
        title?: string;
        startISO: string;
        endISO: string;
        playlistId?: string | number;
        screens?: Array<{ screenId: number | string }>;
        groups?: Array<{ groupId: number | string }>;
        zone?: string;
        idOverride?: string;
      }>
    ) => {
      const {
        startISO,
        endISO,
        title = "New Block",
        playlistId,
        screens,
        groups,
        zone,
        idOverride,
      } = action.payload;

      const useZone = zone ?? state.timeZone ?? "local";

      const s = DateTime.fromISO(startISO, { zone: useZone });
      const e = DateTime.fromISO(endISO, { zone: useZone });

      const id = idOverride ?? nanoid();

      state.blocks.push({
        id,
        title,
        startDate: s.toFormat("dd-MM-yyyy"),
        endDate: e.toFormat("dd-MM-yyyy"),
        startTime: s.toFormat(TIME_FMT),
        endTime: e.toFormat(TIME_FMT),
        playlistId,
        screens,
        groups,
      });
    },

    updateBlockFromISO: (
      state,
      action: PayloadAction<{
        id: string;
        startISO: string;
        endISO: string;
        zone?: string;
      }>
    ) => {
      const { id, startISO, endISO, zone } = action.payload;
      const useZone = zone ?? state.timeZone ?? "local";

      const s = DateTime.fromISO(startISO, { zone: useZone });
      const e = DateTime.fromISO(endISO, { zone: useZone });

      const b = state.blocks.find((x) => String(x.id) === String(id));
      if (b) {
        b.startDate = s.toFormat("dd-MM-yyyy");
        b.endDate = e.toFormat("dd-MM-yyyy");
        b.startTime = s.toFormat(TIME_FMT);
        b.endTime = e.toFormat(TIME_FMT);
      }
    },

    updateBlockParts: (
      state,
      action: PayloadAction<
        Partial<Omit<ScheduleBlock, "id">> & { id: string | number }
      >
    ) => {
      const { id, ...rest } = action.payload;
      const b = state.blocks.find((x) => String(x.id) === String(id));
      if (b) {
        Object.assign(b, rest);
      }
    },

    removeBlock: (state, action: PayloadAction<{ id: string | number }>) => {
      state.blocks = state.blocks.filter(
        (b) => String(b.id) !== String(action.payload.id)
      );
      if (state.selectedBlockId === String(action.payload.id)) {
        state.selectedBlockId = null;
      }
    },

    setBlocks: (state, action: PayloadAction<ScheduleBlock[]>) => {
      state.blocks = action.payload;
      if (
        state.selectedBlockId &&
        !state.blocks.some(
          (b) => String(b.id) === String(state.selectedBlockId)
        )
      ) {
        state.selectedBlockId = null;
      }
    },

    /* NEW: store reserved/readonly blocks from server */
    setReservedBlocks: (state, action: PayloadAction<ScheduleBlock[]>) => {
      state.reservedBlocks = action.payload ?? [];
    },

    setSelectedBlockId: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.selectedBlockId = action.payload;
    },
    clearSelectedBlockId: (state) => {
      state.selectedBlockId = null;
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
  setReservedBlocks,      // <-- export new action
  setSelectedBlockId,
  clearSelectedBlockId,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;

/* ---------------- selectors ---------------- */

export const selectBlocks = (s: RootState) => s.schedule.blocks;
export const selectReservedBlocks = (s: RootState) =>
  s.schedule.reservedBlocks;
export const selectTimeZone = (s: RootState) => s.schedule.timeZone ?? "local";
export const selectSelectedBlockId = (s: RootState) =>
  s.schedule.selectedBlockId;

/**
 * Merge editable blocks (red) and reserved blocks (gray) into one
 * array of FullCalendar EventInput objects.
 */
export const selectCalendarEvents = createSelector(
  [selectBlocks, selectReservedBlocks, selectTimeZone],
  (blocks, reserved, zone) => {
    const redEvents = blocks.flatMap((b) =>
      expandBlockToEvents(b, zone, /*readonly*/ false)
    );
    const grayEvents = reserved.flatMap((b) =>
      expandBlockToEvents(b, zone, /*readonly*/ true)
    );
    return [...grayEvents, ...redEvents];
  }
);

/** helper if you ever need ISO start/end */
export function getBlockISO(
  b: ScheduleBlock,
  zone: string
): { startISO: string; endISO: string } {
  return {
    startISO: partsToISO(b.startDate, b.startTime, zone),
    endISO: partsToISO(b.endDate, b.endTime, zone),
  };
}
