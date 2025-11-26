// Redux/Calendar/calendarViewSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type CalendarViewState = {
  start: string | null;    // ISO string
  end: string | null;      // ISO string
  viewType: string | null; // "timeGridWeek", "timeGridDay", "dayGridMonth", etc.
  viewKey: string | null;  // e.g. "w:2025-11-17"
};

const initialState: CalendarViewState = {
  start: null,
  end: null,
  viewType: null,
  viewKey: null,
};

type SetCalendarViewPayload = {
  start: string;
  end: string;
  viewType: string;
  viewKey: string;
};

const calendarViewSlice = createSlice({
  name: "calendarView",
  initialState,
  reducers: {
    setCalendarView(state, action: PayloadAction<SetCalendarViewPayload>) {
      state.start = action.payload.start;
      state.end = action.payload.end;
      state.viewType = action.payload.viewType;
      state.viewKey = action.payload.viewKey;
    },
    clearCalendarView(state) {
      state.start = null;
      state.end = null;
      state.viewType = null;
      state.viewKey = null;
    },
  },
});

export const { setCalendarView, clearCalendarView } = calendarViewSlice.actions;
export default calendarViewSlice.reducer;
