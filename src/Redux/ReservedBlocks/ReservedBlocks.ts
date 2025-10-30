import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

type Id = number | string;
export type Named = { id: Id; name: string };

/** Stored block (schedule item) */
export type ReservedBlock = {
  id: Id;
  title?: string;
  scheduleItemName?: string;
  playlistId?: number;

  startDate?: string;
  endDate?: string | undefined;
  startTime?: string;
  endTime?: string;

  screens?: Named[];
  groups?: Named[];
};

export type ReservedBlocksState = {
  /** selection coming from the SelectDevicesModel (ids may be preset; names get auto-filled on blocks fetch) */
  selectedGroups: Named[];
  selectedScreens: Named[];
  /** fetched/merged blocks from API */
  items: ReservedBlock[];
};

const initialState: ReservedBlocksState = {
  selectedGroups: [],
  selectedScreens: [],
  items: [],
};

/* ---------------- helpers ---------------- */
function dedupeById<T extends { id: Id }>(arr: T[]): T[] {
  const map = new Map<Id, T>();
  for (const a of arr) map.set(a.id, a);
  return [...map.values()];
}

function buildLookups(blocks: ReservedBlock[]) {
  const screenNameById = new Map<string, string>();
  const groupNameById  = new Map<string, string>();

  for (const b of blocks ?? []) {
    for (const s of b.screens ?? []) {
      if (s?.id != null && s?.name != null) {
        screenNameById.set(String(s.id), s.name);
      }
    }
    for (const g of b.groups ?? []) {
      if (g?.id != null && g?.name != null) {
        groupNameById.set(String(g.id), g.name);
      }
    }
  }
  return { screenNameById, groupNameById };
}

function refillSelectionFromBlocks(state: ReservedBlocksState) {
  // Keep current IDs; refill their names from blocks if available
  const currentScreenIds = state.selectedScreens.map((s) => s.id);
  const currentGroupIds  = state.selectedGroups.map((g) => g.id);

  const { screenNameById, groupNameById } = buildLookups(state.items);

  const nextScreens: Named[] = [];
  for (const id of currentScreenIds) {
    const key = String(id);
    const name = screenNameById.get(key);
    if (name) nextScreens.push({ id, name });
  }

  const nextGroups: Named[] = [];
  for (const id of currentGroupIds) {
    const key = String(id);
    const name = groupNameById.get(key);
    if (name) nextGroups.push({ id, name });
  }

  state.selectedScreens = dedupeById(nextScreens);
  state.selectedGroups  = dedupeById(nextGroups);
}

/* ---------------- slice ---------------- */
const reservedBlocksSlice = createSlice({
  name: "ReservedBlocks",
  initialState,
  reducers: {
    /** Save current selection (chips) – you can pass ids-only; names will be auto-filled after blocks load */
    setReservedSelection(
      state,
      action: PayloadAction<{ groups: Named[]; screens: Named[] }>
    ) {
      state.selectedGroups = dedupeById(action.payload.groups ?? []);
      state.selectedScreens = dedupeById(action.payload.screens ?? []);
      // No refill here; it will happen automatically when blocks come in (upsertMany / setAll)
    },

    /** Clear selection */
    clearReservedSelection(state) {
      state.selectedGroups = [];
      state.selectedScreens = [];
    },

    /** Merge or insert many blocks by id, then auto-refill selection names */
    upsertMany(state, action: PayloadAction<ReservedBlock[]>) {
      const map = new Map<Id, ReservedBlock>();
      for (const b of state.items) map.set(b.id, b);
      for (const incoming of action.payload ?? []) {
        const prev = map.get(incoming.id);
        map.set(incoming.id, { ...(prev ?? {}), ...incoming });
      }
      state.items = [...map.values()];

      // 🔁 auto-refill selected names using the new items
      refillSelectionFromBlocks(state);
    },

    /** Replace all blocks, then auto-refill selection names */
    setAll(state, action: PayloadAction<ReservedBlock[]>) {
      state.items = dedupeById(action.payload ?? []);
      // 🔁 auto-refill selected names using the new items
      refillSelectionFromBlocks(state);
    },

    /** Optional: explicit sync API if you ever need to trigger it manually */
    syncSelectionFromBlocks(
      state,
      action: PayloadAction<void | undefined>
    ) {
      refillSelectionFromBlocks(state);
    },
  },
});

export const {
  setReservedSelection,
  clearReservedSelection,
  upsertMany,
  setAll,
  syncSelectionFromBlocks,
} = reservedBlocksSlice.actions;

/* selectors */
export const selectReservedSelectedGroups = (s: RootState) =>
  (s as any).ReservedBlocks.selectedGroups as Named[];
export const selectReservedSelectedScreens = (s: RootState) =>
  (s as any).ReservedBlocks.selectedScreens as Named[];
export const selectAllReservedBlocks = (s: RootState) =>
  (s as any).ReservedBlocks.items as ReservedBlock[];

export default reservedBlocksSlice.reducer;
