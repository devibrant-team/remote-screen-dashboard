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
selectedDevices: Array<number | string>
};

const initialState: ScreensState = {
  items: [],
  lastSyncedAt: null,
  selectedDevices: [],
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
    setSelectedDevices(state, action: PayloadAction<Array<number | string>>) {
      state.selectedDevices = action.payload ?? [];
    },
    clearScreens(state) {
      state.items = [];
      state.lastSyncedAt = null;
    },
    toggleSelectedDevice(state, action: PayloadAction<number | string>) {
      const id = action.payload;
      const exists = state.selectedDevices.some(
        (x) => String(x) === String(id)
      );

      if (exists) {
        state.selectedDevices = state.selectedDevices.filter(
          (x) => String(x) !== String(id)
        );
      } else {
        state.selectedDevices.push(id);
      }
    },
    clearSelectedDevices(state) {
      state.selectedDevices = [];
    },
  },
});
export const selectScreens = (state: RootState) => state.screens.items;
export const selectSelectedDevices = (state: RootState) =>
  state.screens.selectedDevices;
export const { setScreens, upsertScreen, removeScreen, clearScreens , setSelectedDevices,
  toggleSelectedDevice,
  clearSelectedDevices, } =
  screenSlice.actions;
export default screenSlice.reducer;
