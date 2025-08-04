// Redux/slices/playlistEditorSlice.ts

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { GridSlotConfig } from "../../../Config/GridConfig/DefaultGridConfig";

interface NormalPlaylistState {
  name: string;
  duration: number;
  scale: string;
  slots: GridSlotConfig[];
  selectedGrid: string;
}

const initialState: NormalPlaylistState = {
  name: "",
  duration: 10,
  scale: "Original Scale",
  slots: [],
  selectedGrid: "default",
};

const NormalPlaylistSlice = createSlice({
  name: "NormalPlaylist",
  initialState,
  reducers: {
    setSelectedGrid: (state, action: PayloadAction<string>) => {
      state.selectedGrid = action.payload;
    },
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
    updateSlotMedia: (
      state,
      action: PayloadAction<{
        index: number;
        media: string | null;
        mediaType: "image" | "video";
      }>
    ) => {
      const slot = state.slots.find((s) => s.index === action.payload.index);
      if (slot) {
        slot.media = action.payload.media;
        slot.mediaType = action.payload.mediaType;
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
  updateSlotMedia,
  updateSlotScale,
  setSelectedGrid,
} = NormalPlaylistSlice.actions;

export default NormalPlaylistSlice.reducer;
