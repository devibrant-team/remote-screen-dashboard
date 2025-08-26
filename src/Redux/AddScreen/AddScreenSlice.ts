// /Redux/ScreenForm/screenFormSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";


export type IdLike = number | string;

export type ScreenFormState = {
  name: string;
  code: string; // keep as string (your zod enforces 6 digits in UI)
  groupId: IdLike | null;
};

const initialState: ScreenFormState = {
  name: "",
  code: "",
  groupId: null,
};

const screenFormSlice = createSlice({
  name: "screenForm",
  initialState,
  reducers: {
    setScreenName: (s, a: PayloadAction<string>) => {
      s.name = a.payload;
    },
    setScreenCode: (s, a: PayloadAction<string>) => {
      s.code = a.payload;
    },
    setScreenGroupId: (s, a: PayloadAction<IdLike | null>) => {
      s.groupId = a.payload;
    },
    // Optional bulk setter
    setScreenFormMany: (s, a: PayloadAction<Partial<ScreenFormState>>) => {
      Object.assign(s, a.payload);
    },
    resetScreenForm: () => initialState,
  },
});

export const {
  setScreenName,
  setScreenCode,
  setScreenGroupId,
  setScreenFormMany,
  resetScreenForm,
} = screenFormSlice.actions;

export default screenFormSlice.reducer;

// Selectors
export const selectScreenForm = (state: RootState) => state.screenForm;
export const selectScreenFormPayload = (state: RootState) => {
  const { name, code,  groupId } = state.screenForm;
  return { name, code, group_id: groupId };
};
