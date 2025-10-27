// src/Redux/schedule/scheduleSlice.ts
import { createSlice, type PayloadAction, nanoid } from "@reduxjs/toolkit";
import type {
  ScheduleItem,
  ScheduleState,
  ScreenRef,
  GroupRef,
} from "../Schedule/ScheduleTypes";
import type { RootState } from "../../../store";

const initialState: ScheduleState = {
  byId: {},
  allIds: [],
};

type AddItemPayload = Omit<ScheduleItem, "id"> & { id?: string };
type UpdateItemPayload = Partial<Omit<ScheduleItem, "id">> & { id: string };

const scheduleSlice = createSlice({
  name: "schedule",
  initialState,
  reducers: {
    addItem: {
      reducer(state, action: PayloadAction<ScheduleItem>) {
        const item = action.payload;
        if (!state.byId[item.id]) {
          state.allIds.push(item.id);
        }
        state.byId[item.id] = item;
      },
      prepare(payload: AddItemPayload) {
        return {
          payload: {
            id: payload.id ?? nanoid(),
            title: payload.title,
            playlistId: payload.playlistId,
            startDate: payload.startDate,
            startTime: payload.startTime,
            endDate: payload.endDate,
            endTime: payload.endTime,
            screens: payload.screens ?? [],
            groups: payload.groups ?? [],
          } as ScheduleItem,
        };
      },
    },

    updateItem(state, action: PayloadAction<UpdateItemPayload>) {
      const { id, ...changes } = action.payload;
      const existing = state.byId[id];
      if (!existing) return;
      state.byId[id] = { ...existing, ...changes };
    },

    removeItem(state, action: PayloadAction<{ id: string }>) {
      const id = action.payload.id;
      if (!state.byId[id]) return;
      delete state.byId[id];
      state.allIds = state.allIds.filter((x) => x !== id);
    },

    clearAll(state) {
      state.byId = {};
      state.allIds = [];
    },

    // convenience helpers
    setItemTimes(
      state,
      action: PayloadAction<{
        id: string;
        startDate: string;
        startTime: string;
        endDate: string;
        endTime: string;
      }>
    ) {
      const { id, startDate, startTime, endDate, endTime } = action.payload;
      const item = state.byId[id];
      if (!item) return;
      item.startDate = startDate;
      item.startTime = startTime;
      item.endDate = endDate;
      item.endTime = endTime;
    },

    setItemTitle(state, action: PayloadAction<{ id: string; title: string }>) {
      const item = state.byId[action.payload.id];
      if (!item) return;
      item.title = action.payload.title;
    },

    setItemPlaylist(
      state,
      action: PayloadAction<{ id: string; playlistId: string }>
    ) {
      const item = state.byId[action.payload.id];
      if (!item) return;
      item.playlistId = action.payload.playlistId;
    },

    // screens
    addScreenToItem(
      state,
      action: PayloadAction<{ id: string; screen: ScreenRef }>
    ) {
      const { id, screen } = action.payload;
      const item = state.byId[id];
      if (!item) return;
      if (!item.screens.some((s) => s.screenId === screen.screenId)) {
        item.screens.push(screen);
      }
    },

    removeScreenFromItem(
      state,
      action: PayloadAction<{ id: string; screenId: number }>
    ) {
      const { id, screenId } = action.payload;
      const item = state.byId[id];
      if (!item) return;
      item.screens = item.screens.filter((s) => s.screenId !== screenId);
    },

    // groups
    addGroupToItem(
      state,
      action: PayloadAction<{ id: string; group: GroupRef }>
    ) {
      const { id, group } = action.payload;
      const item = state.byId[id];
      if (!item) return;
      if (!item.groups.some((g) => g.groupId === group.groupId)) {
        item.groups.push(group);
      }
    },

    removeGroupFromItem(
      state,
      action: PayloadAction<{ id: string; groupId: number }>
    ) {
      const { id, groupId } = action.payload;
      const item = state.byId[id];
      if (!item) return;
      item.groups = item.groups.filter((g) => g.groupId !== groupId);
    },
  },
});


export const {
  addItem,
  updateItem,
  removeItem,
  clearAll,
  setItemTimes,
  setItemTitle,
  setItemPlaylist,
  addScreenToItem,
  removeScreenFromItem,
  addGroupToItem,
  removeGroupFromItem,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;
