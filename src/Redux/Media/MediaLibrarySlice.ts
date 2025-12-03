import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type MediaItem = {
  tag: string | null;          // 👈 CHANGED
  storage: number | string;    // 👈 optional improvement
  id: number;
  media: string;
  type?: string;
};

export interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type MediaLibraryState = {
  items: MediaItem[];
  meta: Meta;
  page: number;
  perPage: number;
  tag: string | null;
  lightboxOpen: boolean;
  selectedIndex: number | null;
  loading: boolean;
};

const initialState: MediaLibraryState = {
  items: [],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 6,
    total: 0,
  },
  page: 1,
  perPage: 24,
  tag: null,
  lightboxOpen: false,
  selectedIndex: null,
  loading: false,
};

const mediaLibrarySlice = createSlice({
  name: "mediaLibrary",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload);
    },
    setPerPage(state, action: PayloadAction<number>) {
      state.perPage = Math.max(1, action.payload);
    },
    setItems(state, action: PayloadAction<MediaItem[]>) {
      state.items = action.payload;
    },
    setMeta(state, action: PayloadAction<Partial<Meta>>) {
      state.meta = { ...state.meta, ...action.payload };
    },
    openLightbox(state, action: PayloadAction<number>) {
      state.selectedIndex = action.payload;
      state.lightboxOpen = true;
    },
    closeLightbox(state) {
      state.lightboxOpen = false;
      state.selectedIndex = null;
    },
    nextItem(state) {
      if (state.selectedIndex === null) return;
      state.selectedIndex = Math.min(
        state.items.length - 1,
        state.selectedIndex + 1
      );
    },
    prevItem(state) {
      if (state.selectedIndex === null) return;
      state.selectedIndex = Math.max(0, state.selectedIndex - 1);
    },
  },
});

export const {
  setLoading,
  setPage,
  setPerPage,
  setItems,
  setMeta,
  openLightbox,
  closeLightbox,
  nextItem,
  prevItem,
} = mediaLibrarySlice.actions;

export default mediaLibrarySlice.reducer;
