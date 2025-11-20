// src/ReactQuery/Tag/TagSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type IdLike = number | string;

export interface TagState {
  tagId: IdLike | null;          // existing tag id (from server)
  tagText: string | null;        // new tag text (when creating)
  mediaIds: IdLike[];            // selected media ids
  selectedTagId: IdLike | "all"; // 🔴 current filter in header
}

const initialState: TagState = {
  tagId: null,
  tagText: null,
  mediaIds: [],
  selectedTagId: "all", // default header filter
};

const tagSlice = createSlice({
  name: "tag",
  initialState,
  reducers: {
    // when user selects an existing tag in modal (for assign)
    setExistingTag(state, action: PayloadAction<IdLike>) {
      state.tagId = action.payload;
      state.tagText = null;
    },

    // when user types a new tag in modal
    setNewTagText(state, action: PayloadAction<string>) {
      const text = action.payload.trim();
      state.tagText = text.length ? text : null;
      state.tagId = null;
    },

    // replace all selected media ids
    setMediaIds(state, action: PayloadAction<IdLike[]>) {
      state.mediaIds = action.payload;
    },

    clearMedia(state) {
      state.mediaIds = [];
    },

    clearTag(state) {
      state.tagId = null;
      state.tagText = null;
    },

    resetTagState() {
      return initialState;
    },

    // 🔴 NEW: header filter (All / specific tag)
    setSelectedTagId(state, action: PayloadAction<IdLike | "all">) {
      state.selectedTagId = action.payload;
    },
  },
});

export const {
  setExistingTag,
  setNewTagText,
  setMediaIds,
  clearMedia,
  clearTag,
  resetTagState,
  setSelectedTagId, // 🔴 export this
} = tagSlice.actions;

export default tagSlice.reducer;
