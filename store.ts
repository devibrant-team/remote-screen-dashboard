import { configureStore } from "@reduxjs/toolkit";
import machineReducer from "./src/Redux/Machine/machineSlice";
import authReducer from "./src/Redux/Authentications/AuthSlice";
import NormalPlaylistReducer from "./src/Redux/Playlist/ToolBarFunc/SlideNormalPlaylistSlice";
import playlistReducer from "./src/Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import playlistInteractiveReducer from "./src/Redux/Playlist/interactivePlaylist/playlistInteractiveSlice";
import MediaReducer from "./src/Redux/Media/MediaSlice";
import mediaPickerReducer from "./src/Redux/Media/MediaSlice";
import screenFormReducer from "./src/Redux/AddScreen/AddScreenSlice";
import screenManagementReducer from "./src/Redux/ScreenManagement/ScreenManagementSlice";
import groupFormReducer from "./src/Redux/AddGroup/AddGroupSlice";
import screensReducer from "./src/Redux/ScreenManagement/ScreenSlice";
import playlistEditorReducer from "./src/Redux/Playlist/EditPlaylist/EditNormalPlaylistSlice";
import mediaLibraryReducer from "./src/Redux/Media/MediaLibrarySlice";
import interactiveReducer from "./src/Redux/Playlist/interactivePlaylist/interactiveSlice";
import groupReducer from "./src/Redux/ScreenManagement/GroupSlice";
import ScheduleItemReducer from "./src/Redux/ScheduleItem/ScheduleItemSlice";
import ReservedBlocksreducer from "./src/Redux/ReservedBlocks/ReservedBlocks";
import selectedBlockReducer from "./src/Redux/Block/BlockSlice";
import supportReducer from "./src/Redux/Support/SupportSlice";
import tagReducer from "./src/ReactQuery/Tag/TagSlice"
export const store = configureStore({
  reducer: {
    machine: machineReducer,
    auth: authReducer,
    normalplaylist: NormalPlaylistReducer,
    playlist: playlistReducer,
    playlistInteractive: playlistInteractiveReducer,
    media: MediaReducer,
    mediaPicker: mediaPickerReducer,
    screenForm: screenFormReducer,
    groupForm: groupFormReducer,
    screenManagement: screenManagementReducer,
    screens: screensReducer,
    playlistEditor: playlistEditorReducer,
    mediaLibrary: mediaLibraryReducer,
    interactive: interactiveReducer,
    groups: groupReducer,
    ScheduleItem: ScheduleItemReducer,
    ReservedBlocks: ReservedBlocksreducer,
    selectedBlock: selectedBlockReducer,
    support: supportReducer,
     tag: tagReducer,
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
