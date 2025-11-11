// src/Redux/ScreenManagement/ScreenSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

/* ----------------------------- Types ----------------------------- */
export type Screen = {
  id: number | string;     // DB id (identity)
  name?: string | null;
  ratio?: string | null;
  branch?: string | null;
  active?: boolean | null;
  lastSeen?: string | null;
  screenId: number;        // hardware id (never identity)
};

export type SelectedDevice = { id: number; name: string };

type ScreensState = {
  items: Screen[];
  lastSyncedAt?: string | null;
  selectedDevices: SelectedDevice[]; // store as objects {id,name}
};

/* --------------------------- Initial State --------------------------- */
const initialState: ScreensState = {
  items: [],
  lastSyncedAt: null,
  selectedDevices: [],
};

/* ----------------------------- Helpers ----------------------------- */
const getDbId = (s: any): number | null => {
  const n = Number(s?.id ?? s?._id);
  return Number.isFinite(n) ? n : null;
};

/** Get a real name from items if it exists; otherwise return "" (no placeholder). */
const findNameInItems = (items: Screen[], id: number): string => {
  const nm = (items.find((x) => getDbId(x) === id)?.name ?? "").toString().trim();
  return nm || "";
};

/* ------------------------------ Slice ------------------------------ */
const screenSlice = createSlice({
  name: "screens",
  initialState,
  reducers: {
    setScreens(state, action: PayloadAction<Screen[]>) {
      state.items = action.payload ?? [];
      state.lastSyncedAt = new Date().toISOString();

      // Optional gentle refresh of selection names from items (no placeholders).
      state.selectedDevices = (state.selectedDevices ?? []).map((d) => {
        const id = Number(d.id);
        const nmFromItems = findNameInItems(state.items, id);
        return {
          id,
          name: nmFromItems || d.name || "", // keep previous if items has none
        };
      });
 
    },

    upsertScreen(state, action: PayloadAction<Screen>) {
    
      const idx = state.items.findIndex(
        (s) => String(s.id) === String(action.payload.id)
      );
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.push(action.payload);

      // If this screen is in selection, update its name from items (no placeholders).
      const id = Number(action.payload.id);
      const selIdx = state.selectedDevices.findIndex((d) => d.id === id);
      if (selIdx >= 0) {
        state.selectedDevices[selIdx] = {
          id,
          name: findNameInItems(state.items, id) || state.selectedDevices[selIdx].name || "",
        };
       
      }
    },

    removeScreen(state, action: PayloadAction<number | string>) {
      state.items = state.items.filter(
        (s) => String(s.id) !== String(action.payload)
      );
    },

    /** Replace the whole selection with objects {id,name}. (No placeholders added) */
    setSelectedDevices(state, action: PayloadAction<Array<SelectedDevice>>) {

      state.selectedDevices = (action.payload ?? []).map((d) => ({
        id: Number(d.id),
        name: (d.name ?? "").toString(), // keep exactly what caller provided (or empty)
      }));
   
    },

    clearScreens(state) {
      state.items = [];
      state.lastSyncedAt = null;
    },

    toggleSelectedDevice(
      state,
      action: PayloadAction<number | string | SelectedDevice>
    ) {
      let id: number;
      let nameFromPayload: string | undefined;

      if (typeof action.payload === "object") {
        id = Number((action.payload as SelectedDevice).id);
        nameFromPayload = (action.payload as SelectedDevice).name;
      } else {
        id = Number(action.payload);
      }
      if (!Number.isFinite(id)) return;

      const idx = state.selectedDevices.findIndex((d) => d.id === id);
      if (idx >= 0) {
        state.selectedDevices.splice(idx, 1);
        return;
      }

      // Prefer payload name, else use real name from items, else empty string (no fake placeholder).
      const name = (nameFromPayload ?? findNameInItems(state.items, id) ?? "").toString();
      state.selectedDevices.push({ id, name });
    },

    clearSelectedDevices(state) {
      state.selectedDevices = [];
    },
  },
});

/* ---------------------------- Selectors ---------------------------- */
export const selectScreens = (state: RootState) => state.screens.items;
export const selectSelectedDevices = (state: RootState) =>
  state.screens.selectedDevices;

/* ------------------------------ Exports ------------------------------ */
export const {
  setScreens,
  upsertScreen,
  removeScreen,
  clearScreens,
  setSelectedDevices,
  toggleSelectedDevice,
  clearSelectedDevices,
} = screenSlice.actions;

export default screenSlice.reducer;
