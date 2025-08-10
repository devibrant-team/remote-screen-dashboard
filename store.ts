import { configureStore } from "@reduxjs/toolkit";
import machineReducer from "./src/Redux/Machine/machineSlice";
import authReducer from "./src/Redux/Authentications/AuthSlice";
import NormalPlaylistReducer from "./src/Redux/Playlist/ToolBarFunc/SlideNormalPlaylistSlice";
import playlistReducer from "./src/Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import playlistInteractiveReducer from "./src/Redux/Playlist/interactivePlaylist/playlistInteractiveSlice";
export const store = configureStore({
  reducer: {
    machine: machineReducer,
    auth: authReducer,
    normalplaylist: NormalPlaylistReducer,
    playlist: playlistReducer,
    playlistInteractive: playlistInteractiveReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["playlist/updateSlotInSlide"],
        ignoredPaths: ["playlist.slides", "playlist.slides[].slots"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
