// Redux/slices/playlistSlice.ts

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { NormalPlaylistState } from "./SlideNormalPlaylistSlice";
import type { GridSlotConfig } from "../../../Config/GridConfig/DefaultGridConfig";
import type { SlotWidget } from "../../../Config/GridConfig/DefaultGridConfig";

export type RatioRecord = {
  id: number;
  ratio: string; // "16:9"
  numerator: number; // 16
  denominator: number; // 9
  width?: number;
  height?: number;
};

export interface PlaylistState {
  id: string;
  name: string;
  type: number; // future-proofing if you add other types later
  slides: NormalPlaylistState[];
  selectedSlideIndex: number | null;
  selectedRatio: RatioRecord | null;
  isEdit: boolean;
  selectedCity: string;
  isLoading: boolean;
}

const initialState: PlaylistState = {
  id: "",
  name: "",
  isEdit: false,
  type: 1,
  slides: [],
  selectedSlideIndex: null,
  selectedRatio: null,
  selectedCity: "",
  isLoading: false,
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    setPlaylistName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setIsEdit: (state, action: PayloadAction<boolean>) => {
      state.isEdit = action.payload;
    },
    setSelectedCity: (state, action: PayloadAction<string>) => {
      state.selectedCity = action.payload;
    },
    setSelectedId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
    setPlaylistRatio: (state, action: PayloadAction<RatioRecord>) => {
      state.selectedRatio = action.payload;
    },
    setSelectedSlideIndex: (state, action: PayloadAction<number | null>) => {
      state.selectedSlideIndex = action.payload;
    },
    setPlaylistLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
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
      action: PayloadAction<{
        index: number;
        selectedGrid: string;
        grid_style: number;
      }>
    ) => {
      const { index, selectedGrid, grid_style } = action.payload;
      state.slides[index].selectedGrid = selectedGrid;
      state.slides[index].grid_style = grid_style;
    },
    // NormalPlaylistSlice.ts
    updateSlotInSlide: (state, action) => {
      const { slideIndex, slotIndex } = action.payload;
      const slide = state.slides[slideIndex];
      const slot = slide?.slots.find((s) => s.index === slotIndex);
      if (!slot) return;

      slot.media = action.payload.media;
      slot.mediaType = action.payload.mediaType;

      if (Object.prototype.hasOwnProperty.call(action.payload, "ImageFile")) {
        slot.ImageFile = action.payload.ImageFile ?? null; // ✅ allow null
      }
      if (Object.prototype.hasOwnProperty.call(action.payload, "mediaId")) {
        slot.mediaId = action.payload.mediaId ?? null;
      }
      // ✅ set even if empty string/“fit”; don’t rely on truthiness
      if (Object.prototype.hasOwnProperty.call(action.payload, "scale")) {
        slot.scale = action.payload.scale;
      }
    },

    // add this action next to updateSlotInSlide etc.
    updateSlotWidgetInSlide: (
      state,
      action: PayloadAction<{
        slideIndex: number;
        slotIndex: number;
        widget: SlotWidget;
      }>
    ) => {
      const { slideIndex, slotIndex, widget } = action.payload;
      const slide = state.slides[slideIndex];
      if (!slide) return;
      const slot = slide.slots.find((s: any) => s.index === slotIndex);
      if (!slot) return;
      slot.widget = widget; // can be weather OR clock
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
    reorderSlide: (
      state,
      action: PayloadAction<{ from: number; to: number }>
    ) => {
      const { from, to } = action.payload;
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= state.slides.length ||
        to >= state.slides.length
      ) {
        return;
      }

      // remove and re-insert
      const [moved] = state.slides.splice(from, 1);
      state.slides.splice(to, 0, moved);

      // fix selectedSlideIndex if needed
      if (state.selectedSlideIndex === null) return;

      if (state.selectedSlideIndex === from) {
        state.selectedSlideIndex = to;
      } else if (
        state.selectedSlideIndex > from &&
        state.selectedSlideIndex <= to
      ) {
        state.selectedSlideIndex -= 1;
      } else if (
        state.selectedSlideIndex < from &&
        state.selectedSlideIndex >= to
      ) {
        state.selectedSlideIndex += 1;
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
  updateSlotWidgetInSlide,
  clearPlaylist,
  updateSlideSlots,
  updateSlotInSlide,
  updateSlideGrid,
  setPlaylistRatio,
  setSelectedCity,
  reorderSlide,
  setSelectedId,
  setIsEdit,
  setPlaylistLoading,
} = playlistSlice.actions;

export default playlistSlice.reducer;
