// /Redux/ScreenManagement/ScreenManagementSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

export type IdLike = string | number;

export type ScreenManagementState = {
  selectedRatioId: IdLike | null;
  selectedRatioName: string | null;
  selectedBranchId: IdLike | null;
};

const initialState: ScreenManagementState = {
  selectedRatioId: null,
  selectedRatioName: null,
  selectedBranchId: null,
};

const screenManagementSlice = createSlice({
  name: "screenManagement",
  initialState,
  reducers: {
    setSelectedRatio: (
      s,
      a: PayloadAction<{ id: IdLike | null; name: string | null }>
    ) => {
      s.selectedRatioId = a.payload.id;
      s.selectedRatioName = a.payload.name;
    },
    setSelectedBranchId: (s, a: PayloadAction<IdLike | null>) => {
      s.selectedBranchId = a.payload;
    },
    resetScreenManagement: () => initialState,
  },
});

export const { setSelectedRatio, setSelectedBranchId, resetScreenManagement } =
  screenManagementSlice.actions;

export default screenManagementSlice.reducer;

// Selectors
export const selectSelectedScreenRatioId = (st: RootState) =>
  st.screenManagement.selectedRatioId;
export const selectSelectedScreenRatioName = (st: RootState) =>
  st.screenManagement.selectedRatioName;
export const selectSelectedBranchId = (st: RootState) =>
  st.screenManagement.selectedBranchId;
