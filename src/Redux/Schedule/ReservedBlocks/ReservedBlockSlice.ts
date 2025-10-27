// src/Redux/Schedule/ReservedBlockSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../../store";


/* ================= Types that match your API ================= */

export type ScreenRef = { screenId: number };
export type GroupRef  = { groupId: number };

export type ReservedBlock = {
  id: number;
  title: string;
  playlistId: number;
  startDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm:ss"
  endDate:   string; // "YYYY-MM-DD"
  endTime:   string; // "HH:mm:ss"
  groups: GroupRef[];
  screens: ScreenRef[];
};

export type ReservedResponse = {
  success: boolean;
  from: string | null;
  to: string | null;
  schedule: ReservedBlock[];
};

/* ================= Slice state ================= */

type ReservedState = {
  byId: Record<number, ReservedBlock>;
  allIds: number[];
  from: string | null;
  to: string | null;
  success: boolean | null;
  lastFetchedAt: number | null;
};

const initialState: ReservedState = {
  byId: {},
  allIds: [],
  from: null,
  to: null,
  success: null,
  lastFetchedAt: null,
};

/* ================= Helpers (tolerant) ================= */

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function asBlock(x: unknown): ReservedBlock | null {
  if (!x || typeof x !== "object") return null;
  const obj = x as Record<string, unknown>;

  const ok =
    isFiniteNum(obj.id) &&
    typeof obj.title === "string" &&
    isFiniteNum(obj.playlistId) &&
    typeof obj.startDate === "string" &&
    typeof obj.startTime === "string" &&
    typeof obj.endDate === "string" &&
    typeof obj.endTime === "string";

  if (!ok) return null;

  const groupsArr = Array.isArray(obj.groups) ? (obj.groups as unknown[]) : [];
  const screensArr = Array.isArray(obj.screens) ? (obj.screens as unknown[]) : [];

  return {
    id: obj.id as number,
    title: obj.title as string,
    playlistId: obj.playlistId as number,
    startDate: obj.startDate as string,
    startTime: obj.startTime as string,
    endDate: obj.endDate as string,
    endTime: obj.endTime as string,
    groups: groupsArr
      .map((g: unknown) => {
        const gg = g as { groupId?: unknown };
        const groupId = Number(gg?.groupId);
        return Number.isFinite(groupId) ? ({ groupId } as GroupRef) : null;
      })
      .filter((g: GroupRef | null): g is GroupRef => g !== null),
    screens: screensArr
      .map((s: unknown) => {
        const ss = s as { screenId?: unknown };
        const screenId = Number(ss?.screenId);
        return Number.isFinite(screenId) ? ({ screenId } as ScreenRef) : null;
      })
      .filter((s: ScreenRef | null): s is ScreenRef => s !== null),
  };
}

function normalize(rows: unknown) {
  const list: ReservedBlock[] = (Array.isArray(rows) ? rows : [])
    .map(asBlock)
    .filter((b): b is ReservedBlock => !!b);

  const byId: Record<number, ReservedBlock> = {};
  const allIds: number[] = [];
  for (const r of list) {
    byId[r.id] = r;
    allIds.push(r.id);
  }
  return { byId, allIds };
}

/* ================= Slice ================= */

const reservedSlice = createSlice({
  name: "reservedBlocks",
  initialState,
  reducers: {
    setReservedFromResponse(state, action: PayloadAction<unknown>) {
      const raw = action.payload as any;

      const scheduleRaw = Array.isArray(raw?.schedule)
        ? raw.schedule
        : Array.isArray(raw?.data?.schedule)
        ? raw.data.schedule
        : [];

      const { byId, allIds } = normalize(scheduleRaw);

      state.byId = byId;
      state.allIds = allIds;
      state.from = (raw?.from ?? raw?.data?.from ?? null) as string | null;
      state.to = (raw?.to ?? raw?.data?.to ?? null) as string | null;
      state.success = Boolean(raw?.success ?? raw?.data?.success ?? true);
      state.lastFetchedAt = Date.now();
    },

    replaceAll(state, action: PayloadAction<ReservedBlock[]>) {
      const { byId, allIds } = normalize(action.payload);
      state.byId = byId;
      state.allIds = allIds;
      state.lastFetchedAt = Date.now();
    },

    upsertMany(state, action: PayloadAction<ReservedBlock[]>) {
      for (const r of action.payload) {
        const block = asBlock(r);
        if (!block) continue;
        const exists = !!state.byId[block.id];
        state.byId[block.id] = block;
        if (!exists) state.allIds.push(block.id);
      }
      state.lastFetchedAt = Date.now();
    },

    removeById(state, action: PayloadAction<number>) {
      const id = action.payload;
      if (state.byId[id]) {
        delete state.byId[id];
        state.allIds = state.allIds.filter((x: number) => x !== id);
      }
      state.lastFetchedAt = Date.now();
    },

    clearAll() {
      return initialState;
    },
  },
});

export const {
  setReservedFromResponse,
  replaceAll,
  upsertMany,
  removeById,
  clearAll,
} = reservedSlice.actions;

export default reservedSlice.reducer;

/* ================= Selectors ================= */

export const selectReservedState = (s: RootState) => s.reservedBlocks;

export const selectAllReservedBlocks = (s: RootState): ReservedBlock[] => {
  const st = selectReservedState(s);
  return st.allIds
    .map((id: number) => st.byId[id])
    .filter((b): b is ReservedBlock => !!b);
};

export const selectReservedById =
  (id: number) =>
  (s: RootState): ReservedBlock | undefined =>
    selectReservedState(s).byId[id];

export const selectReservedMeta = (s: RootState) => {
  const { from, to, success, lastFetchedAt } = selectReservedState(s);
  return { from, to, success, lastFetchedAt };
};

export const selectReservedForDate =
  (isoDate: string) =>
  (s: RootState): ReservedBlock[] => {
    const all = selectAllReservedBlocks(s);
    return all.filter(
      (b: ReservedBlock) => isoDate >= b.startDate && isoDate <= b.endDate
    );
  };
