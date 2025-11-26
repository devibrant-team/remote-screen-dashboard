import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";
import type { Block } from "../Block/BlockSlice";

type ScheduleBlocksState = {
  // which schedule item we are showing blocks for
  scheduleItemId: number | string | null;

  // which calendar viewKey is currently active, e.g. "w:2025-12-13"
  currentViewKey: string | null;

  // blocks for the currentViewKey (this is what the UI shows)
  currentBlocks: Block[];

  loading: boolean;

  // cache for *this* schedule item:
  // viewKey -> blocks for that range
  cache: Record<string, Block[]>;
};

const initialState: ScheduleBlocksState = {
  scheduleItemId: null,
  currentViewKey: null,
  currentBlocks: [],
  loading: false,
  cache: {},
};

type SetScheduleItemPayload = {
  scheduleItemId: number | string | null;
};

type SetBlocksForViewPayload = {
  viewKey: string;
  blocks: Block[];
};

type SetCurrentFromCachePayload = {
  viewKey: string;
};

const scheduleBlocksSlice = createSlice({
  name: "scheduleBlocks",
  initialState,
  reducers: {
    // when user selects a schedule item
    setScheduleBlocksScheduleItem(
      state,
      action: PayloadAction<SetScheduleItemPayload>
    ) {
      const { scheduleItemId } = action.payload;
      state.scheduleItemId = scheduleItemId;

      // clear old cache & current blocks when changing schedule
      state.currentViewKey = null;
      state.currentBlocks = [];
      state.cache = {};
      state.loading = false;
    },

    // start a load (for spinner etc.)
    setScheduleBlocksLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // when we get fresh data from DB for a viewKey
    setBlocksForView(state, action: PayloadAction<SetBlocksForViewPayload>) {
      const { viewKey, blocks } = action.payload;
      state.cache[viewKey] = blocks;
      state.currentViewKey = viewKey;
      state.currentBlocks = blocks;
      state.loading = false;
    },

    // when we hit cache for a viewKey
    setCurrentBlocksFromCache(
      state,
      action: PayloadAction<SetCurrentFromCachePayload>
    ) {
      const { viewKey } = action.payload;
      const cached = state.cache[viewKey];
      if (cached) {
        state.currentViewKey = viewKey;
        state.currentBlocks = cached;
        state.loading = false;
      }
    },

    // optional: if you want to clear everything (e.g. on logout)
    clearScheduleBlocks(state) {
      state.scheduleItemId = null;
      state.currentViewKey = null;
      state.currentBlocks = [];
      state.cache = {};
      state.loading = false;
    },
  },
});

export const {
  setScheduleBlocksScheduleItem,
  setScheduleBlocksLoading,
  setBlocksForView,
  setCurrentBlocksFromCache,
  clearScheduleBlocks,
} = scheduleBlocksSlice.actions;

export const selectScheduleBlocksState = (s: RootState) => s.scheduleBlocks;
export const selectCurrentBlocks = (s: RootState) =>
  s.scheduleBlocks.currentBlocks;
export const selectScheduleBlocksLoading = (s: RootState) =>
  s.scheduleBlocks.loading;

export default scheduleBlocksSlice.reducer;
