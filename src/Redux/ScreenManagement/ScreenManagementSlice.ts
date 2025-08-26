// /Redux/ScreenManagement/ScreenManagementSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

export type IdLike = string | number;

export type ScreenManagementState = {
  selectedScreenRatioId: IdLike | null;
  selectedBranchId: IdLike | null;
};

const initialState: ScreenManagementState = {
  selectedScreenRatioId: null,
  selectedBranchId: null,
};

const screenManagementSlice = createSlice({
  name: "screenManagement",
  initialState,
  reducers: {
    setSelectedRatioId: (s, a: PayloadAction<IdLike | null>) => {
      s.selectedScreenRatioId = a.payload;
    },
    setSelectedBranchId: (s, a: PayloadAction<IdLike | null>) => {
      s.selectedBranchId = a.payload;
    },
    resetScreenManagement: () => initialState,
  },
});

export const {
  setSelectedRatioId,
  setSelectedBranchId,
  resetScreenManagement,
} = screenManagementSlice.actions;

export default screenManagementSlice.reducer;

// Selectors
export const selectSelectedScreenRatioId = (st: RootState) =>
  st.screenManagement.selectedScreenRatioId;
export const selectSelectedBranchId = (st: RootState) =>
  st.screenManagement.selectedBranchId;
