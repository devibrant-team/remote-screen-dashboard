// /Redux/ScreenManagement/ScreenManagementSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

export type IdLike = string | number;

export type ScreenManagementState = {
  selectedRatioId: IdLike | null;
  selectedRatioName: string | null;
  selectedBranchId: IdLike | null;
  playlist_id: IdLike | null;
  FilterScreenAcctoBranchId: IdLike | null;
};

const initialState: ScreenManagementState = {
  selectedRatioId: null,
  selectedRatioName: null,
  selectedBranchId: null,
  playlist_id: null,
  FilterScreenAcctoBranchId: null,
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
    setFilterScreenAcctoBranchId: (s, a: PayloadAction<IdLike | null>) => {
      s.FilterScreenAcctoBranchId = a.payload;
    },
    setDefaultPlaylist: (s, a: PayloadAction<IdLike | null>) => {
      s.playlist_id = a.payload;
    },
    resetScreenManagement: () => initialState,
  },
});

export const {
  setSelectedRatio,
  setSelectedBranchId,
  setDefaultPlaylist,
  resetScreenManagement,
  setFilterScreenAcctoBranchId,
} = screenManagementSlice.actions;

export default screenManagementSlice.reducer;

// Selectors
export const selectSelectedScreenRatioId = (st: RootState) =>
  st.screenManagement.selectedRatioId;
export const selectSelectedScreenRatioName = (st: RootState) =>
  st.screenManagement.selectedRatioName;
export const selectSelectedBranchId = (st: RootState) =>
  st.screenManagement.selectedBranchId;
export const selectedDefaultPlaylistId = (st: RootState) =>
  st.screenManagement.playlist_id;

