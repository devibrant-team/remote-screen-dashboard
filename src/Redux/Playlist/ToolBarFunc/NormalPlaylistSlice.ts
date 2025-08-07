// Redux/slices/playlistSlice.ts

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { NormalPlaylistState } from "./SlideNormalPlaylistSlice";
import type { GridSlotConfig } from "../../../Config/GridConfig/DefaultGridConfig";

export interface PlaylistState {
  id: number;
  name: string;
  type: "Normal"; // future-proofing if you add other types later
  slides: NormalPlaylistState[];
  selectedSlideIndex: number | null;
}

const initialState: PlaylistState = {
  id: 1,
  name: "HEHHE",
  type: "Normal",
  slides: [],
  selectedSlideIndex: null,
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    setPlaylistName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },

    setSelectedSlideIndex: (state, action: PayloadAction<number | null>) => {
      state.selectedSlideIndex = action.payload;
    },

    addSlide: (state, action: PayloadAction<NormalPlaylistState>) => {
      state.slides.push(action.payload);
    },

    updateSlideAtIndex: (
      state,
      action: PayloadAction<{
        index: number;
        updatedSlide: NormalPlaylistState;
      }>
    ) => {
      const { index, updatedSlide } = action.payload;
      if (index >= 0 && index < state.slides.length) {
        state.slides[index] = updatedSlide;
      }
    },
    updateSlideSlots: (
      state,
      action: PayloadAction<{ index: number; slots: GridSlotConfig[] }>
    ) => {
      state.slides[action.payload.index].slots = action.payload.slots;
    },

    updateSlideGrid: (
      state,
      action: PayloadAction<{ index: number; selectedGrid: string }>
    ) => {
      state.slides[action.payload.index].selectedGrid =
        action.payload.selectedGrid;
    },

    updateSlotInSlide: (
      state,
      action: PayloadAction<{
        slideIndex: number;
        slotIndex: number;
        media: string;
        mediaType: "image" | "video";
        scale?: GridSlotConfig["scale"];
      }>
    ) => {
      const slide = state.slides[action.payload.slideIndex];
      const slot = slide?.slots.find(
        (s) => s.index === action.payload.slotIndex
      );
      if (slot) {
        slot.media = action.payload.media;
        slot.mediaType = action.payload.mediaType;
        if (action.payload.scale) slot.scale = action.payload.scale;
      }
    },

    removeSlideAtIndex: (state, action: PayloadAction<number>) => {
      state.slides.splice(action.payload, 1);
      if (state.selectedSlideIndex === action.payload) {
        state.selectedSlideIndex = null;
      } else if (
        state.selectedSlideIndex !== null &&
        state.selectedSlideIndex > action.payload
      ) {
        state.selectedSlideIndex -= 1;
      }
    },

    clearPlaylist: () => initialState,
  },
});

export const {
  setPlaylistName,
  setSelectedSlideIndex,
  addSlide,
  updateSlideAtIndex,
  removeSlideAtIndex,
  clearPlaylist,
  updateSlideSlots,
  updateSlotInSlide,
  updateSlideGrid,
} = playlistSlice.actions;

export default playlistSlice.reducer;
