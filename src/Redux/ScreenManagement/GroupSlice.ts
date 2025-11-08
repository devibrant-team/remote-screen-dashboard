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
  ratioId?: number | string |null;
  defaultPlaylistId?: number | null;
  defaultPlaylistName?: string | null;
};

type GroupsState = {
  items: Group[];
  lastSyncedAt?: string | null;
  selectedGroups: Array<number | string>;
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
    setGroups(state, action: PayloadAction<Group[]>) {
      state.items = action.payload ?? [];
      state.lastSyncedAt = new Date().toISOString();
    },

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

    removeGroup(state, action: PayloadAction<number | string>) {
      state.items = state.items.filter(
        (g) => String(g.id) !== String(action.payload)
      );

      // OPTIONAL: if the removed group was the selected one, clear it
      if (
        state.selectedGroup &&
        String(state.selectedGroup.id) === String(action.payload)
      ) {
        state.selectedGroup = null;
      }
    },

    clearGroups(state) {
      state.items = [];
      state.lastSyncedAt = null;
      state.selectedGroups = [];
      state.selectedGroup = null; // <--- clear selectedGroup too
    },

    toggleSelectedGroup(state, action: PayloadAction<number | string>) {
      const id = action.payload;
      const exists = state.selectedGroups.some((g) => String(g) === String(id));

      if (exists) {
        state.selectedGroups = state.selectedGroups.filter(
          (g) => String(g) !== String(id)
        );
      } else {
        state.selectedGroups.push(id);
      }
    },

    setSelectedGroups(state, action: PayloadAction<Array<number | string>>) {
      state.selectedGroups = action.payload ?? [];
    },

    clearSelectedGroups(state) {
      state.selectedGroups = [];
    },

    setSelectedGroup(state, action: PayloadAction<Group | null>) {
      state.selectedGroup = action.payload;
    },


    clearSelectedGroup(state) {
      state.selectedGroup = null;
    },
  },
});

export const {
  setGroups,
  upsertGroup,
  removeGroup,
  clearGroups,
  toggleSelectedGroup,
  setSelectedGroups,
  clearSelectedGroups,
  setSelectedGroup,
  clearSelectedGroup, // <--- export it
} = groupSlice.actions;

export const selectGroups = (state: RootState) => state.groups.items;
export const selectSelectedGroups = (state: RootState) =>
  state.groups.selectedGroups;
export const selectSelectedGroup = (state: RootState) =>
  state.groups.selectedGroup;

export default groupSlice.reducer;
