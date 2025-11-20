// src/Redux/Playlist/interactivePlaylist/playlistInteractiveSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface Slide {
  index: number;
  image: string;
}

interface PlaylistData {
  Playlist_Name: string;
  type: string;         // e.g., "Interactive"
  numberSlide: number;  // should equal slides.length
  slides: Slide[];
  layoutId?: number;    // 2 or 3 (others = no cap)
}

export interface PlaylistState {
  playlistData: PlaylistData | null;
}

/* ------------------------- helpers & constants ------------------------- */

const STORAGE_KEY = "playlistinteractive";

// Caps only for specific layouts (no default cap)
const LAYOUT_CAPS: Record<number, number> = {
  2: 4,
  3: 7,
};

const getCapForLayout = (layoutId?: number): number | undefined =>
  layoutId !== undefined ? LAYOUT_CAPS[layoutId] : undefined;

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const safeRemove = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

/**
 * Ensure slides honor the current cap (if any):
 * - trims slides if they exceed the cap for the layout
 * - reindexes slides (0..n-1)
 * - syncs numberSlide
 */
function enforceCap(data: PlaylistData): PlaylistData {
  const cap = getCapForLayout(data.layoutId);
  const source = Array.isArray(data.slides) ? data.slides : [];

  const normalized = (cap ? source.slice(0, cap) : source).map((s, i) => ({
    ...s,
    index: i,
  }));

  return {
    ...data,
    slides: normalized,
    numberSlide: normalized.length,
  };
}

function persist(state: PlaylistState) {
  safeSet(STORAGE_KEY, JSON.stringify(state.playlistData));
}

/* ------------------------------- initial ------------------------------- */

const persisted = safeGet(STORAGE_KEY);
const initialState: PlaylistState = {
  playlistData: persisted ? JSON.parse(persisted) : null,
};

/* -------------------------------- slice -------------------------------- */

const playlistInteractiveSlice = createSlice({
  name: "playlistinteractive",
  initialState,
  reducers: {
    /** Save full playlist (will be capped for layouts 2/3 only) */
    savePlaylist: (state, action: PayloadAction<PlaylistData>) => {
      const incoming = action.payload;
      state.playlistData = enforceCap(incoming);
      persist(state);
    },

    /** Save/Change layoutId (trims slides only if new layout has a cap) */
    saveLayoutId: (state, action: PayloadAction<number>) => {
      const newLayoutId = action.payload;

      if (!state.playlistData) {
        state.playlistData = {
          Playlist_Name: "",
          type: "Interactive",
          numberSlide: 0,
          slides: [],
          layoutId: newLayoutId,
        };
      } else {
        state.playlistData.layoutId = newLayoutId;
      }

      state.playlistData = enforceCap(state.playlistData);
      persist(state);
    },

    /** Replace only the slides array (will be capped for layouts 2/3 only) */
    setSlides: (state, action: PayloadAction<Slide[]>) => {
      if (!state.playlistData) return;

      const cap = getCapForLayout(state.playlistData.layoutId);
      const incoming = Array.isArray(action.payload) ? action.payload : [];

      const trimmed = (cap ? incoming.slice(0, cap) : incoming).map((s, i) => ({
        ...s,
        index: i,
      }));

      state.playlistData.slides = trimmed;
      state.playlistData.numberSlide = trimmed.length;
      persist(state);
    },

    /** Clear everything */
    clearPlaylist: (state) => {
      state.playlistData = null;
      safeRemove(STORAGE_KEY);
    },

    /** Update the playlist name */
    setPlaylistName: (state, action: PayloadAction<string>) => {
      if (!state.playlistData) return;
      state.playlistData.Playlist_Name = action.payload;
      persist(state);
    },
  },
});

export const {
  savePlaylist,
  saveLayoutId,
  clearPlaylist,
  setSlides,
  setPlaylistName,
} = playlistInteractiveSlice.actions;

export default playlistInteractiveSlice.reducer;

/* -------------------------------- selectors ---------------------------- */

export const selectPlaylistInteractive = (s: any): PlaylistData | null =>
  (s.playlistinteractive?.playlistData as PlaylistData | null) ?? null;

export const selectLayoutId = (s: any): number | undefined =>
  (s.playlistinteractive?.playlistData as PlaylistData | null)?.layoutId;

/**
 * Max selectable slides for the current layout.
 * Returns a number only for capped layouts (2/3). Otherwise undefined = no cap.
 */
export const selectMaxSelectable = (s: any): number | undefined => {
  const layoutId = selectLayoutId(s);
  return getCapForLayout(layoutId);
};

export const selectSlides = (s: any): Slide[] =>
  (s.playlistinteractive?.playlistData?.slides as Slide[]) ?? [];

export const selectNumberSlide = (s: any): number =>
  (s.playlistinteractive?.playlistData?.numberSlide as number) ?? 0;
