import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

type Id = number | string;

export type Block = {
  id: Id;
  playlistId?: number | string;
  playlistName?: string;

  // Time strings (YYYY-MM-DD / HH:mm:ss)
  start_day: string;
  start_time: string;
  end_day?: string;
  end_time?: string;

  // Compact API-ready shapes
  screens: Array<{ screenId: number }>;
  groups: Array<{ groupId: number }>;

  created_at?: string;
  updated_at?: string;
};

type SelectedBlockState = {
  selected: Block | null;
};

const initialState: SelectedBlockState = {
  selected: null,
};

const selectedBlockSlice = createSlice({
  name: "selectedBlock",
  initialState,
  reducers: {
    setSelectedBlock(state, action: PayloadAction<Block>) {
      state.selected = action.payload;
    },
    clearSelectedBlock(state) {
      state.selected = null;
    },
  },
});

export const { setSelectedBlock, clearSelectedBlock } = selectedBlockSlice.actions;
export const selectSelectedBlock = (s: RootState) => s.selectedBlock.selected;
export default selectedBlockSlice.reducer;
