// src/Redux/Media/MediaSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SelectedMedia = {
  id: number;
  url: string;     // media URL
  type?: string;   // "image" | "video" | ...
};

export interface MediaState {
  selectedMedia: SelectedMedia[];
}

// No localStorage: keep it purely in Redux memory
const initialState: MediaState = {
  selectedMedia: [],
};

const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {
    // Toggle add/remove by id (url kept on add; ignored on remove)
    toggleMediaSelection(state, action: PayloadAction<SelectedMedia>) {
      const { id, url, type } = action.payload;
      const idx = state.selectedMedia.findIndex((m) => m.id === id);
      if (idx >= 0) {
        state.selectedMedia.splice(idx, 1);
      } else {
        state.selectedMedia.push({ id, url, type });
      }
    },

    // Replace all (deduped by id; last wins)
    setSelectedMedia(state, action: PayloadAction<SelectedMedia[]>) {
      const map = new Map<number, SelectedMedia>();
      for (const m of action.payload) map.set(m.id, m);
      state.selectedMedia = Array.from(map.values());
    },

    removeSelectedMediaById(state, action: PayloadAction<number>) {
      state.selectedMedia = state.selectedMedia.filter((m) => m.id !== action.payload);
    },

    clearSelectedMedia(state) {
      state.selectedMedia = [];
    },
  },
});

export const {
  toggleMediaSelection,
  setSelectedMedia,
  removeSelectedMediaById,
  clearSelectedMedia,
} = mediaSlice.actions;

export default mediaSlice.reducer;

// Selectors
export const selectSelectedMedia = (s: any) => s.media.selectedMedia as SelectedMedia[];
export const selectSelectedMediaIds = (s: any) =>
  (s.media.selectedMedia as SelectedMedia[]).map((m) => m.id);
export const selectSelectedMediaUrls = (s: any) =>
  (s.media.selectedMedia as SelectedMedia[]).map((m) => m.url);
