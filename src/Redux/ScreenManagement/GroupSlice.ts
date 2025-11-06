// src/Redux/ScreenManagement/GroupSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

export type Group = {
  id: number | string;
  name: string;
  ratio?: string | null;
  branchName?: string | null;
  screenNumber?: number | null;
  branchId?: number | null;
  ratioId?: number | null;
  defaultPlaylistId?: number | null;
  defaultPlaylistName?: string | null;
};

type GroupsState = {
  items: Group[];
  lastSyncedAt?: string | null;
  selectedGroups: Array<number | string>; // <-- NEW
  selectedGroup: Group | null;
};

const initialState: GroupsState = {
  items: [],
  lastSyncedAt: null,
  selectedGroups: [],
  selectedGroup: null,
};

const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    // hydrate/replace the groups list from API
    setGroups(state, action: PayloadAction<Group[]>) {
      state.items = action.payload ?? [];
      state.lastSyncedAt = new Date().toISOString();
    },

    // create or update a single group in items
    upsertGroup(state, action: PayloadAction<Group>) {
      const idx = state.items.findIndex(
        (g) => String(g.id) === String(action.payload.id)
      );
      if (idx >= 0) {
        state.items[idx] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    },

    // remove a group from items
    removeGroup(state, action: PayloadAction<number | string>) {
      state.items = state.items.filter(
        (g) => String(g.id) !== String(action.payload)
      );
    },

    // wipe items list
    clearGroups(state) {
      state.items = [];
      state.lastSyncedAt = null;
      state.selectedGroups = []; // also clear selection for safety
    },

    // ---------- NEW STUFF BELOW ----------

    // toggle a group in/out of the selectedGroups array
    toggleSelectedGroup(state, action: PayloadAction<number | string>) {
      const id = action.payload;
      const exists = state.selectedGroups.some((g) => String(g) === String(id));

      if (exists) {
        // remove it
        state.selectedGroups = state.selectedGroups.filter(
          (g) => String(g) !== String(id)
        );
      } else {
        // add it
        state.selectedGroups.push(id);
      }
    },

    // set all selected groups at once (optional helper)
    setSelectedGroups(state, action: PayloadAction<Array<number | string>>) {
      state.selectedGroups = action.payload ?? [];
    },

    // clear just the selection (keep items)
    clearSelectedGroups(state) {
      state.selectedGroups = [];
    },
    setSelectedGroup(state, action: PayloadAction<Group | null>) {
      state.selectedGroup = action.payload;
    },
  },
});

export const {
  setGroups,
  upsertGroup,
  removeGroup,
  clearGroups,
  toggleSelectedGroup, // <-- export
  setSelectedGroups, // <-- export (optional)
  clearSelectedGroups, 
  setSelectedGroup,
} = groupSlice.actions;

// selectors
export const selectGroups = (state: RootState) => state.groups.items;

export const selectSelectedGroups = (state: RootState) =>
  state.groups.selectedGroups; // <-- NEW selector
export const selectSelectedGroup = (state: RootState) =>
  state.groups.selectedGroup; // <-- NEW selector

export default groupSlice.reducer;
