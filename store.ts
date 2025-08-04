import { configureStore } from "@reduxjs/toolkit";
import machineReducer from "./src/Redux/Machine/machineSlice";
import authReducer from "./src/Redux/Authentications/AuthSlice";
import NormalPlaylistReducer from "./src/Redux/Playlist/ToolBarFunc/SlideNormalPlaylistSlice";
import playlistReducer from "./src/Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
export const store = configureStore({
  reducer: {
    machine: machineReducer,
    auth: authReducer,
    normalplaylist: NormalPlaylistReducer,
    playlist: playlistReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
