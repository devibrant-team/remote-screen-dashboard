// src/Redux/Schedule/UiSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

type ScheduleUiState = {
  overlayScreenId: number | null;
};

const initialState: ScheduleUiState = {
  overlayScreenId: null,
};

const scheduleUiSlice = createSlice({
  name: "scheduleUi",
  initialState,
  reducers: {
    setOverlayScreenId(state, action: PayloadAction<number | null>) {
      state.overlayScreenId = action.payload;
    },
  },
});

export const { setOverlayScreenId } = scheduleUiSlice.actions;

export const selectOverlayScreenId = (s: RootState) =>
  s.scheduleUi.overlayScreenId;

export default scheduleUiSlice.reducer;
