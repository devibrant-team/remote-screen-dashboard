// Redux/slices/playlistSlice.ts

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { NormalPlaylistState } from "./SlideNormalPlaylistSlice";

interface PlaylistState {
  name: string;
  type: "Normal"; // future-proofing if you add other types later
  slides: NormalPlaylistState[];
  selectedSlideIndex: number | null;
}

const initialState: PlaylistState = {
  name: "",
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
      action: PayloadAction<{ index: number; updatedSlide: NormalPlaylistState }>
    ) => {
      const { index, updatedSlide } = action.payload;
      if (index >= 0 && index < state.slides.length) {
        state.slides[index] = updatedSlide;
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
} = playlistSlice.actions;

export default playlistSlice.reducer;
