// Redux/slices/playlistEditorSlice.ts

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { GridSlotConfig } from "../../../Config/GridConfig/DefaultGridConfig";

interface NormalPlaylistState {
  name: string;
  duration: number;
  scale: string;
  slots: GridSlotConfig[];
}

const initialState: NormalPlaylistState = {
  name: "",
  duration: 10,
  scale: "Original Scale",
  slots: [],
};

const NormalPlaylistSlice = createSlice({
  name: "NormalPlaylist",
  initialState,
  reducers: {
    setPlaylistName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setScale: (state, action: PayloadAction<string>) => {
      state.scale = action.payload;
    },
    setSlots: (state, action: PayloadAction<GridSlotConfig[]>) => {
      state.slots = action.payload;
    },
    updateSlotImage: (
      state,
      action: PayloadAction<{ index: number; image: string }>
    ) => {
      const slot = state.slots.find((s) => s.index === action.payload.index);
      if (slot) {
        slot.image = action.payload.image;
      }
    },
    updateSlotScale: (
      state,
      action: PayloadAction<{ index: number; scale: GridSlotConfig["scale"] }>
    ) => {
      const slot = state.slots.find((s) => s.index === action.payload.index);
      if (slot) {
        slot.scale = action.payload.scale;
      }
    },
  },
});

export const {
  setPlaylistName,
  setDuration,
  setScale,
  setSlots,
  updateSlotImage,
  updateSlotScale,
} = NormalPlaylistSlice.actions;

export default NormalPlaylistSlice.reducer;
