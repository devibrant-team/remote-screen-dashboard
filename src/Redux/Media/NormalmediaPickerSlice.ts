import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type MediaPickerState = {
  open: boolean;
  slideIndex: number | null;
  slotIndex: number | null;
};

const initialState: MediaPickerState = {
  open: false,
  slideIndex: null,
  slotIndex: null,
};

const mediaPickerSlice = createSlice({
  name: "mediaPicker",
  initialState,
  reducers: {
    openMediaPicker: (
      state,
      action: PayloadAction<{ slideIndex: number; slotIndex: number }>
    ) => {
      state.open = true;
      state.slideIndex = action.payload.slideIndex;
      state.slotIndex = action.payload.slotIndex;
    },
    closeMediaPicker: (state) => {
      state.open = false;
      state.slideIndex = null;
      state.slotIndex = null;
    },
  },
});

export const { openMediaPicker, closeMediaPicker } = mediaPickerSlice.actions;
export default mediaPickerSlice.reducer;
