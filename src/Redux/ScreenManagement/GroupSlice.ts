import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

export type Group = {
  id: number | string;
  name: string;
  ratio?: string | null;
  branchName?: string | null;
  screenNumber?: number | null;
};

type GroupsState = {
  items: Group[];
  lastSyncedAt?: string | null;
};

const initialState: GroupsState = {
  items: [],
  lastSyncedAt: null,
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
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.push(action.payload);
    },
    removeGroup(state, action: PayloadAction<number | string>) {
      state.items = state.items.filter(
        (g) => String(g.id) !== String(action.payload)
      );
    },
    clearGroups(state) {
      state.items = [];
      state.lastSyncedAt = null;
    },
  },
});

export const { setGroups, upsertGroup, removeGroup, clearGroups } =
  groupSlice.actions;

export const selectGroups = (state: RootState) => state.groups.items;

export default groupSlice.reducer;
