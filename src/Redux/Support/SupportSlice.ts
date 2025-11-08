// src/Redux/Support/SupportSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

// High-level area where the user has an issue (from Support page cards)
export type SupportCategory = "screen" | "content" | "billing" | "general";

// Type of topic the user has
export type SupportTopicType = "question" | "software";

// Type of screen device (only relevant when category = "screen")
export type ScreenDeviceType =
  | "windows"
  | "android_screen"
  | "android_stick"
  | null;

export type SupportState = {
  category: SupportCategory;     // e.g. screen / content / billing / general
  topicType: SupportTopicType;   // question OR software
  screenName: string;
  description: string;
  screenDeviceType: ScreenDeviceType;
};

const initialState: SupportState = {
  category: "general",
  topicType: "question",
  screenName: "",
  description: "",
  screenDeviceType: null,
};

const supportSlice = createSlice({
  name: "support",
  initialState,
  reducers: {
    setSupportCategory(state, action: PayloadAction<SupportCategory>) {
      state.category = action.payload;
    },
    setSupportTopicType(state, action: PayloadAction<SupportTopicType>) {
      state.topicType = action.payload;
    },
    setSupportScreenName(state, action: PayloadAction<string>) {
      state.screenName = action.payload;
    },
    setSupportDescription(state, action: PayloadAction<string>) {
      state.description = action.payload;
    },
    setSupportScreenDeviceType(state, action: PayloadAction<ScreenDeviceType>) {
      state.screenDeviceType = action.payload;
    },
    resetSupportForm(state) {
      // Keep the category, reset the rest
      state.topicType = "question";
      state.screenName = "";
      state.description = "";
      state.screenDeviceType = null;
    },
  },
});

export const {
  setSupportCategory,
  setSupportTopicType,
  setSupportScreenName,
  setSupportDescription,
  setSupportScreenDeviceType,
  resetSupportForm,
} = supportSlice.actions;

export default supportSlice.reducer;

// Selector
export const selectSupport = (st: RootState) => st.support;
