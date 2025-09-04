import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";
export type Screen = {
  id: number | string;
  name?: string | null;
  ratio?: string | null;
  branch?: string | null;
  active?: boolean | null;
  lastSeen?: string | null;
  screenId: number;
};

type ScreensState = {
  items: Screen[];
  lastSyncedAt?: string | null;
};

const initialState: ScreensState = {
  items: [],
  lastSyncedAt: null,
};

const screenSlice = createSlice({
  name: "screens",
  initialState,
  reducers: {
    setScreens(state, action: PayloadAction<Screen[]>) {
      state.items = action.payload ?? [];
      state.lastSyncedAt = new Date().toISOString();
    },
    upsertScreen(state, action: PayloadAction<Screen>) {
      const idx = state.items.findIndex(
        (s) => String(s.id) === String(action.payload.id)
      );
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.push(action.payload);
    },
    removeScreen(state, action: PayloadAction<number | string>) {
      state.items = state.items.filter(
        (s) => String(s.id) !== String(action.payload)
      );
    },
    clearScreens(state) {
      state.items = [];
      state.lastSyncedAt = null;
    },
  },
});
export const selectScreens = (state: RootState) => state.screens.items;
export const { setScreens, upsertScreen, removeScreen, clearScreens } =
  screenSlice.actions;
export default screenSlice.reducer;
