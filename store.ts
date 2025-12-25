import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./rootReducer";
export const store = configureStore({
    reducer: rootReducer,
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
