import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type MediaItem = {
  tag: string | undefined;
  storage: number;
  id: number;
  media: string;
  type?: string;
};

type Meta = {
  last_page: number;
  total: number;
};

type MediaLibraryState = {
  items: MediaItem[];
  meta: Meta;
  page: number;
  perPage: number;
  tag: string | null;
  // lightbox state
  lightboxOpen: boolean;
  selectedIndex: number | null;

  // loading flag (optional—handy for Pager disable)
  loading: boolean;
};

const initialState: MediaLibraryState = {
  items: [],
  meta: { last_page: 1, total: 0 },
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
