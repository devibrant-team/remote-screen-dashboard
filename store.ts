import { configureStore } from '@reduxjs/toolkit';
import machineReducer from './src/Redux/Machine/machineSlice'
import authReducer from "./src/Redux/Authentications/AuthSlice"
export const store = configureStore({
  reducer: {
  machine: machineReducer,
      auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
 
