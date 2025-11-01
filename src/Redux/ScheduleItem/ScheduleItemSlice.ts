// src/Redux/ScheduleItem/ScheduleItemSlice.ts
import {
  createSlice,
  type PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import type { RootState } from "../../../store";
import type { ScheduleBlock } from "./GetScheduleItemBlocks";

/* ------------------------------- State -------------------------------- */
export type ScheduleItemState = {
  id: string | null;
  name: string | null;
  scheduleItemBlocks: ScheduleBlock[];
  /** Cached unique screens extracted from blocks: { id, name } */
  screens: Array<{ id: number; name: string }>;
  /** Cached unique groups extracted from blocks: { id, name } */
  groups: Array<{ id: number; name: string }>;
  selectedscreenId: string | null;
  selectedgroupId: string | null;
};

const initialState: ScheduleItemState = {
  id: null,
  name: null,
  scheduleItemBlocks: [],
  screens: [],
  groups: [],
  selectedscreenId: null,
  selectedgroupId: null,
};

/* ------------------------------ Helpers -------------------------------- */
function deriveUniqueScreens(
  blocks: ScheduleBlock[]
): Array<{ id: number; name: string }> {
  const all = blocks.flatMap((b) => b?.screens ?? []);
  return Array.from(
    new Map(
      all
        .map((s) => {
          const idNum = typeof s?.id === "number" ? s.id : Number(s?.id);
          if (!Number.isFinite(idNum)) return null;
          return [idNum, { id: idNum, name: s?.name ?? "" }] as const;
        })
        .filter(Boolean) as Array<
        readonly [number, { id: number; name: string }]
      >
    ).values()
  );
}

function deriveUniqueGroups(
  blocks: ScheduleBlock[]
): Array<{ id: number; name: string }> {
  const all = blocks.flatMap((b) => b?.groups ?? []);
  return Array.from(
    new Map(
      all
        .map((g) => {
          const idNum = typeof g?.id === "number" ? g.id : Number(g?.id);
          if (!Number.isFinite(idNum)) return null;
          return [idNum, { id: idNum, name: g?.name ?? "" }] as const;
        })
        .filter(Boolean) as Array<
        readonly [number, { id: number; name: string }]
      >
    ).values()
  );
}

function deriveScreensAndGroups(blocks: ScheduleBlock[]) {
  return {
    screens: deriveUniqueScreens(blocks),
    groups: deriveUniqueGroups(blocks),
  };
}

/* -------------------------------- Slice ------------------------------- */
const ScheduleItemSlice = createSlice({
  name: "ScheduleItem",
  initialState,
  reducers: {
    setScheduleItem(
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) {
      state.id = action.payload.id;
      state.name = action.payload.name;
    },
    setScheduleItemId(state, action: PayloadAction<string | null>) {
      state.id = action.payload;
    },
    setScheduleItemName(state, action: PayloadAction<string | null>) {
      state.name = action.payload;
    },

    /* ----------------------- Blocks reducers ----------------------- */
    setScheduleItemBlocks(state, action: PayloadAction<ScheduleBlock[]>) {
      state.scheduleItemBlocks = action.payload ?? [];
      const derived = deriveScreensAndGroups(state.scheduleItemBlocks);
      state.screens = derived.screens;
      state.groups = derived.groups;
    },
    addScheduleItemBlock(state, action: PayloadAction<ScheduleBlock>) {
      const b = action.payload;
      const idx = state.scheduleItemBlocks.findIndex((x) => x.id === b.id);
      if (idx === -1) state.scheduleItemBlocks.push(b);
      else state.scheduleItemBlocks[idx] = b;
      const derived = deriveScreensAndGroups(state.scheduleItemBlocks);
      state.screens = derived.screens;
      state.groups = derived.groups;
    },
    upsertScheduleItemBlocks(state, action: PayloadAction<ScheduleBlock[]>) {
      const incoming = action.payload ?? [];
      for (const b of incoming) {
        const idx = state.scheduleItemBlocks.findIndex((x) => x.id === b.id);
        if (idx === -1) state.scheduleItemBlocks.push(b);
        else state.scheduleItemBlocks[idx] = b;
      }
      const derived = deriveScreensAndGroups(state.scheduleItemBlocks);
      state.screens = derived.screens;
      state.groups = derived.groups;
    },
    removeScheduleItemBlock(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.scheduleItemBlocks = state.scheduleItemBlocks.filter(
        (b) => b.id !== id
      );
      const derived = deriveScreensAndGroups(state.scheduleItemBlocks);
      state.screens = derived.screens;
      state.groups = derived.groups;
    },
    clearScheduleItemBlocks(state) {
      state.scheduleItemBlocks = [];
      state.screens = [];
      state.groups = [];
    },

    /* ----------------------- Manual recompute (optional) ----------- */
    setScheduleItemScreens(state) {
      state.screens = deriveUniqueScreens(state.scheduleItemBlocks);
    },
    clearScheduleItemScreens(state) {
      state.screens = [];
    },
    setScheduleItemGroups(state) {
      state.groups = deriveUniqueGroups(state.scheduleItemBlocks);
    },
    clearScheduleItemGroups(state) {
      state.groups = [];
    },

    clearScheduleItem(state) {
      state.id = null;
      state.name = null;
      state.scheduleItemBlocks = [];
      state.screens = [];
      state.groups = [];
    },
    setSelectedScreenId(state, action: PayloadAction<string | null>) {
      state.selectedscreenId = action.payload;
    },
    setSelectedGroupId(state, action: PayloadAction<string | null>) {
      state.selectedgroupId = action.payload;
    },
    clearSelectedScreenId(state) {
      state.selectedscreenId = null;
    },
    clearSelectedGroupId(state) {
      state.selectedgroupId = null;
    },
    // --- add to reducers: { ... } inside createSlice ---
    mergeScheduleItemScreens(
      state,
      action: PayloadAction<Array<{ id: number; name: string }>>
    ) {
      const map = new Map(state.screens.map((s) => [s.id, s]));
      for (const it of action.payload ?? []) {
        if (!map.has(it.id)) map.set(it.id, { id: it.id, name: it.name ?? "" });
      }
      state.screens = Array.from(map.values());
    },

    mergeScheduleItemGroups(
      state,
      action: PayloadAction<Array<{ id: number; name: string }>>
    ) {
      const map = new Map(state.groups.map((g) => [g.id, g]));
      for (const it of action.payload ?? []) {
        if (!map.has(it.id)) map.set(it.id, { id: it.id, name: it.name ?? "" });
      }
      state.groups = Array.from(map.values());
    },
  },
});

export const {
  setScheduleItem,
  setScheduleItemId,
  setScheduleItemName,
  clearScheduleItem,

  setScheduleItemBlocks,
  addScheduleItemBlock,
  upsertScheduleItemBlocks,
  removeScheduleItemBlock,
  clearScheduleItemBlocks,

  setScheduleItemScreens,
  clearScheduleItemScreens,
  setScheduleItemGroups,
  clearScheduleItemGroups,

  setSelectedScreenId,
  setSelectedGroupId,
  clearSelectedScreenId,
  clearSelectedGroupId,
    mergeScheduleItemScreens,
  mergeScheduleItemGroups,
} = ScheduleItemSlice.actions;

/* ------------------------------ Selectors ---------------------------- */
export const selectScheduleItem = (s: RootState) => s.ScheduleItem;
export const selectScheduleItemId = (s: RootState) => s.ScheduleItem.id;
export const selectScheduleItemName = (s: RootState) => s.ScheduleItem.name;
export const selectScheduleItemBlocks = (s: RootState) =>
  s.ScheduleItem.scheduleItemBlocks;

export const selectScheduleItemBlockById =
  (blockId: number) => (s: RootState) =>
    s.ScheduleItem.scheduleItemBlocks.find((b) => b.id === blockId) ?? null;

/** Saved unique arrays (kept in sync automatically) */
export const selectScheduleItemScreens = (s: RootState) =>
  s.ScheduleItem.screens;
export const selectScheduleItemGroups = (s: RootState) => s.ScheduleItem.groups;

/** Optional: derive on-the-fly (memoized) */
export const selectScreensFromBlocks = createSelector(
  [selectScheduleItemBlocks],
  (blocks) => deriveUniqueScreens(blocks)
);
export const selectGroupsFromBlocks = createSelector(
  [selectScheduleItemBlocks],
  (blocks) => deriveUniqueGroups(blocks)
);

/** Optional: given ids, return {id,name} preserving order (memoized creators) */
export const makeSelectScreensByIds = (ids: Array<number | string>) =>
  createSelector([selectScreensFromBlocks], (screens) => {
    const map = new Map(screens.map((s) => [s.id, s]));
    const out: Array<{ id: number; name: string }> = [];
    for (const raw of ids) {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(n) && map.has(n)) out.push(map.get(n)!);
    }
    return out;
  });

export const makeSelectGroupsByIds = (ids: Array<number | string>) =>
  createSelector([selectGroupsFromBlocks], (groups) => {
    const map = new Map(groups.map((g) => [g.id, g]));
    const out: Array<{ id: number; name: string }> = [];
    for (const raw of ids) {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(n) && map.has(n)) out.push(map.get(n)!);
    }
    return out;
  });
export const selectSelectedScreenId = (s: RootState) =>
  s.ScheduleItem.selectedscreenId;
export const selectSelectedGroupId = (s: RootState) =>
  s.ScheduleItem.selectedgroupId;

export default ScheduleItemSlice.reducer;
