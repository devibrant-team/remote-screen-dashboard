// Redux/Playlist/EditPlaylist/EditNormalPlaylistSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import type { NormalPlaylistState } from "../ToolBarFunc/SlideNormalPlaylistSlice";
import { getSpecificPlaylistApi } from "../../../API/API";
import {
  clearPlaylist,
  addSlide,
  setPlaylistName,
  setPlaylistRatio,
  setSelectedId,
  setSelectedSlideIndex,
} from "../ToolBarFunc/NormalPlaylistSlice";

/** -------------------------------------------------------
 * Helpers
 * ----------------------------------------------------- */

type GridKey =
  | "default"
  | "twobyTwo"
  | "twobyTwoCol"
  | "threeRow"
  | "threeCol"
  | "fourGrid";

/** Map numeric grid_style from backend → internal grid key */
const mapGridIdToKey = (id?: number): GridKey => {
  switch (id) {
    case 2:
      return "twobyTwo";
    case 3:
      return "twobyTwoCol";
    case 5:
      return "threeRow";
    case 4:
      return "threeCol";
    case 6:
      return "fourGrid";
    default:
      return "default";
  }
};

/** Normalize one slide from API → NormalPlaylistState (Redux shape) */
function normalizeSlide(apiSlide: any): NormalPlaylistState {
  const slideId = apiSlide?.id ?? apiSlide?._id;
  if (!slideId) {
    // Optional: throw or fallback — your choice
    throw new Error("Slide is missing id");
    // or: slideId = makeId(); // temporary id for rare/legacy cases
  }

  return {
    id: String(slideId),               // use server id as the key
    duration: Number(apiSlide?.duration ?? 0),
    selectedGrid: mapGridIdToKey(apiSlide?.grid_style),
    grid_style: Number(apiSlide?.grid_style ?? 0),
    slots: Array.isArray(apiSlide?.slots)
      ? apiSlide.slots
          .map((s: any) => ({
            index: Number(s?.index ?? 0),
            media: s?.media?.url ?? s?.ImageFile ?? null,
            mediaId: s?.mediaId ?? s?.media?.id ?? null,
            mediaType: (s?.mediaType ?? s?.media?.type ?? "image") as "image" | "video",
            ImageFile: null,
            scale: (s?.scale ?? "fit") as "fit" | "fill" | "blur" | "original" | "stretch",
            widget: s?.widget ?? null,
          }))
          .sort((a: any, b: any) => a.index - b.index)
      : [],
  };
}

/** -------------------------------------------------------
 * Thunk
 * ----------------------------------------------------- */
export const loadPlaylistForEdit = createAsyncThunk(
  "playlist/loadForEdit",
  async (id: number, { dispatch }) => {
    const token = localStorage.getItem("token");

    const { data } = await axios.get(`${getSpecificPlaylistApi}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    // API may return { success, playlist } or the playlist directly
    const playlist = data?.playlist ?? data;
    console.log(playlist)
    if (!playlist) throw new Error("Invalid playlist payload");

    // Reset current editor state
    dispatch(clearPlaylist());

    // Set basic metadata
    if (playlist.id) dispatch(setSelectedId(playlist.id));
    if (playlist.name) dispatch(setPlaylistName(playlist.name));
    if (playlist.ratio) dispatch(setPlaylistRatio(playlist.ratio));

    // Load slides
    if (Array.isArray(playlist.slides)) {
      playlist.slides.forEach((sl: any) => {
        const normalized: NormalPlaylistState = normalizeSlide(sl);
        dispatch(addSlide(normalized));
      });

      // Start editor at first slide
      if (playlist.slides.length > 0) {
        dispatch(setSelectedSlideIndex(0));
      }
    }

    return playlist; // optional for callers
  }
);

/** -------------------------------------------------------
 * Editor meta slice (loading/error)
 * ----------------------------------------------------- */
interface EditorState {
  loading: boolean;
  error: string | null;
}

const initialState: EditorState = {
  loading: false,
  error: null,
};

const playlistEditorSlice = createSlice({
  name: "playlistEditor",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadPlaylistForEdit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPlaylistForEdit.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loadPlaylistForEdit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load playlist";
      });
  },
});

export default playlistEditorSlice.reducer;
