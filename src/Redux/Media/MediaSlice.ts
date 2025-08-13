import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SelectedMedia = {
  id: number;
  url: string;     // media URL
  type?: string;   // "image" | "video" | ...
};

interface MediaState {
  selectedMedia: SelectedMedia[];
}

const safeGet = (k: string) =>
  typeof window !== "undefined" ? localStorage.getItem(k) : null;

const persistedNew = safeGet("selectedMedia");
const persistedOldIds = safeGet("selectedMediaIds"); // migrate old shape if present

const initialState: MediaState = {
  selectedMedia: persistedNew
    ? JSON.parse(persistedNew)
    : persistedOldIds
    ? // migrate: ids only -> objects with empty url
      (JSON.parse(persistedOldIds) as number[]).map((id) => ({ id, url: "" }))
    : [],
};

function persist(state: MediaState) {
  if (typeof window !== "undefined") {
    localStorage.setItem("selectedMedia", JSON.stringify(state.selectedMedia));
    // clean old key if you like:
    localStorage.removeItem("selectedMediaIds");
  }
}

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
      persist(state);
    },

    // Replace all (deduped by id; last wins)
    setSelectedMedia(state, action: PayloadAction<SelectedMedia[]>) {
      const map = new Map<number, SelectedMedia>();
      for (const m of action.payload) map.set(m.id, m);
      state.selectedMedia = Array.from(map.values());
      persist(state);
    },

    removeSelectedMediaById(state, action: PayloadAction<number>) {
      state.selectedMedia = state.selectedMedia.filter((m) => m.id !== action.payload);
      persist(state);
    },

    clearSelectedMedia(state) {
      state.selectedMedia = [];
      if (typeof window !== "undefined") {
        localStorage.removeItem("selectedMedia");
      }
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
