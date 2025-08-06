import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface Slide {
  index: number;
  image: string;
}

interface PlaylistData {
  Playlist_Name: string;
  type: string;
  numberSlide: number;
  slides: Slide[];
}

interface PlaylistState {
  playlistData: PlaylistData | null;
}

// Load from localStorage if available
const localStoragePlaylist = localStorage.getItem("playlistinteractive");
const initialState: PlaylistState = {
  playlistData: localStoragePlaylist ? JSON.parse(localStoragePlaylist) : null,
};

const playlistInteractiveSlice = createSlice({
  name: "playlistinteractive",
  initialState,
  reducers: {
    savePlaylist: (state, action: PayloadAction<PlaylistData>) => {
      console.log("🎧 Saved Playlist Data:", action.payload);
      state.playlistData = action.payload;
      localStorage.setItem("playlistinteractive", JSON.stringify(action.payload));
    },
    clearPlaylist: (state) => {
      console.log("🧹 Playlist cleared");
      state.playlistData = null;
      localStorage.removeItem("playlistinteractive");
    },
  },
});

export const { savePlaylist, clearPlaylist } = playlistInteractiveSlice.actions;
export default playlistInteractiveSlice.reducer;
