// /Redux/GroupForm/groupFormSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";
import type { PayloadAction } from "@reduxjs/toolkit";
export type IdLike = number | string;

export type GroupFormState = {
  name: string;
  assignedScreens: IdLike[]; // holds only IDs
};

const initialState: GroupFormState = {
  name: "",
  assignedScreens: [],
};

const groupFormSlice = createSlice({
  name: "groupForm",
  initialState,
  reducers: {
    setGroupName: (s, a: PayloadAction<string>) => {
      s.name = a.payload;
    },
    addAssignedScreen: (s, a: PayloadAction<IdLike>) => {
      if (!s.assignedScreens.includes(a.payload)) {
        s.assignedScreens.push(a.payload);
      }
    },
    removeAssignedScreen: (s, a: PayloadAction<IdLike>) => {
      s.assignedScreens = s.assignedScreens.filter((id) => id !== a.payload);
    },
    setAssignedScreens: (s, a: PayloadAction<IdLike[]>) => {
      s.assignedScreens = a.payload;
    },
    setGroupFormMany: (s, a: PayloadAction<Partial<GroupFormState>>) => {
      Object.assign(s, a.payload);
    },
    resetGroupForm: () => initialState,
  },
});

export const {
  setGroupName,
  addAssignedScreen,
  removeAssignedScreen,
  setAssignedScreens,
  setGroupFormMany,
  resetGroupForm,
} = groupFormSlice.actions;

export default groupFormSlice.reducer;

// ✅ Selectors
export const selectGroupForm = (state: RootState) => state.groupForm;
export const selectAssignedScreens = (state: RootState) =>
  state.groupForm.assignedScreens;
