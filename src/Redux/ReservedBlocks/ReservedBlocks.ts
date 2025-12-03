import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

/* ------------------------------- Debug ---------------------------------- */

/* ------------------------------- Types ---------------------------------- */
export type Id = number | string;
export type Named = { id: number; name: string };

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
  /** read-only selected devices (as provided by SelectDevices) */
  selectedGroups: Named[];
  selectedScreens: Named[];

  /** fetched/merged blocks from API */
  items: ReservedBlock[];

  /** Focus state (mutually exclusive) + filtered lists */
  focusedScreenId: Id | null;
  focusedGroupId: Id | null;
  reservedBlockforScreen: ReservedBlock[];
  reservedBlockforGroup: ReservedBlock[];
};

/* -------------------------------- State --------------------------------- */
const initialState: ReservedBlocksState = {
  selectedGroups: [],
  selectedScreens: [],
  items: [],
  focusedScreenId: null,
  focusedGroupId: null,
  reservedBlockforScreen: [],
  reservedBlockforGroup: [],
};

/* ------------------------------- Helpers -------------------------------- */
function dedupeById<T extends { id: Id }>(arr: T[]): T[] {
  const map = new Map<Id, T>();
  for (const a of arr) map.set(a.id, a);
  return [...map.values()];
}

function blockHasScreen(b: ReservedBlock, screenId: Id): boolean {
  const target = Number(screenId);
  for (const s of b?.screens ?? []) {
    const sid = typeof s?.id === "number" ? s.id : Number(s?.id);
    if (sid === target) return true;
  }
  return false;
}

function blockHasGroup(b: ReservedBlock, groupId: Id): boolean {
  const target = Number(groupId);
  for (const g of b?.groups ?? []) {
    const gid = typeof g?.id === "number" ? g.id : Number(g?.id);
    if (gid === target) return true;
  }
  return false;
}

/* -------------------------------- Slice --------------------------------- */
/** NOTE: selection chips remain EXACTLY as provided; we don’t auto-refill names. */
const reservedBlocksSlice = createSlice({
  name: "ReservedBlocks",
  initialState,
  reducers: {
    /** Save current selection exactly as provided (ids or ids+names). */
    setReservedSelection(
      state,
      action: PayloadAction<{ groups: Named[]; screens: Named[] }>
    ) {
      state.selectedGroups = dedupeById(action.payload.groups ?? []);
      state.selectedScreens = dedupeById(action.payload.screens ?? []);
    },
    removeReservedBlock(state, action: PayloadAction<Id>) {
      const raw = action.payload;
      const target = Number(raw);

      // remove from master list
      state.items = (state.items ?? []).filter((b) => Number(b.id) !== target);

      // remove from focused lists
      state.reservedBlockforScreen = (
        state.reservedBlockforScreen ?? []
      ).filter((b) => Number(b.id) !== target);

      state.reservedBlockforGroup = (state.reservedBlockforGroup ?? []).filter(
        (b) => Number(b.id) !== target
      );
    },

    /** Clear selection + focus */
    clearReservedSelection(state) {
      state.selectedGroups = [];
      state.selectedScreens = [];
      state.focusedScreenId = null;
      state.focusedGroupId = null;
      state.reservedBlockforScreen = [];
      state.reservedBlockforGroup = [];
    },

    /** Merge or insert many blocks by id; DOES NOT touch selection/focus */
    upsertMany(state, action: PayloadAction<ReservedBlock[]>) {
      const map = new Map<Id, ReservedBlock>();
      for (const b of state.items) map.set(b.id, b);
      for (const incoming of action.payload ?? []) {
        const prev = map.get(incoming.id);
        map.set(incoming.id, { ...(prev ?? {}), ...incoming });
      }
      state.items = [...map.values()];
    },

    /** Replace all blocks; DOES NOT touch selection/focus */
    setAll(state, action: PayloadAction<ReservedBlock[]>) {
      state.items = dedupeById(action.payload ?? []);
    },

    /* ---------------- Focus logic (mutually exclusive + toggle) --------- */
    /**
     * Focus a screen:
     * - Toggle if same as current (click again to unselect).
     * - Clears group focus.
     * - Computes reservedBlockforScreen.
     */
    setFocusedScreenAndCompute(state, action: PayloadAction<Id | null>) {
      const incoming = action.payload;
      const next =
        incoming != null &&
        state.focusedScreenId != null &&
        String(state.focusedScreenId) === String(incoming)
          ? null // toggle off
          : incoming;

      state.focusedScreenId = next;
      // mutually exclusive
      state.focusedGroupId = null;
      state.reservedBlockforGroup = [];

      if (next == null) {
        state.reservedBlockforScreen = [];

        return;
      }

      const numericId = Number(next);
      const filtered = (state.items ?? []).filter((b) =>
        blockHasScreen(b, numericId)
      );
      state.reservedBlockforScreen = filtered;
    },

    /**
     * Focus a group:
     * - Toggle if same as current (click again to unselect).
     * - Clears screen focus.
     * - Computes reservedBlockforGroup.
     */
    setFocusedGroupAndCompute(state, action: PayloadAction<Id | null>) {
      const incoming = action.payload;
      const next =
        incoming != null &&
        state.focusedGroupId != null &&
        String(state.focusedGroupId) === String(incoming)
          ? null // toggle off
          : incoming;

      state.focusedGroupId = next;
      // mutually exclusive
      state.focusedScreenId = null;
      state.reservedBlockforScreen = [];

      if (next == null) {
        state.reservedBlockforGroup = [];

        return;
      }

      const numericId = Number(next);
      const filtered = (state.items ?? []).filter((b) =>
        blockHasGroup(b, numericId)
      );
      state.reservedBlockforGroup = filtered;
    },
  },
});

export const {
  setReservedSelection,
  clearReservedSelection,
  upsertMany,
  setAll,
  setFocusedScreenAndCompute,
  setFocusedGroupAndCompute,
  removeReservedBlock
} = reservedBlocksSlice.actions;

/* -------------------------------- Selectors ----------------------------- */
export const selectReservedSelectedGroups = (s: RootState) =>
  (s as any).ReservedBlocks.selectedGroups as Named[];

export const selectReservedSelectedScreens = (s: RootState) =>
  (s as any).ReservedBlocks.selectedScreens as Named[];

export const selectAllReservedBlocks = (s: RootState) =>
  (s as any).ReservedBlocks.items as ReservedBlock[];

export const selectFocusedScreenId = (s: RootState) =>
  (s as any).ReservedBlocks.focusedScreenId as Id | null;

export const selectFocusedGroupId = (s: RootState) =>
  (s as any).ReservedBlocks.focusedGroupId as Id | null;

export const selectReservedBlockforScreen = (s: RootState) =>
  (s as any).ReservedBlocks.reservedBlockforScreen as ReservedBlock[];

export const selectReservedBlockforGroup = (s: RootState) =>
  (s as any).ReservedBlocks.reservedBlockforGroup as ReservedBlock[];

export default reservedBlocksSlice.reducer;
