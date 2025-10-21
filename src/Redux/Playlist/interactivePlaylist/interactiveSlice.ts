// src/Redux/Interactive/interactiveSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

export interface PlaylistSlide {
  id: number;
  index: number;
  media: string;
  media_id: number;
}

export interface PlaylistDetails {
  id: number;
  name: string;
  slide_number: number;
  style: string;
  slides: PlaylistSlide[];
}

interface InteractiveState {
  selectedId: number | null;
  details: PlaylistDetails | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  /** NEW: whether the UI is in editing mode for the selected playlist */
  isEditing: boolean;            // 👈 add this
}

const initialState: InteractiveState = {
  selectedId: null,
  details: null,
  status: "idle",
  error: null,
  isEditing: false, 
};

export const fetchInteractiveDetails = createAsyncThunk<
  PlaylistDetails,
  number,
  { rejectValue: string }
>("interactive/fetchDetails", async (id, thunkAPI) => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await fetch(`https://srv1005364.hstgr.cloud/api/playlistdetails/${id}`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: thunkAPI.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return thunkAPI.rejectWithValue(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
    }

    const data = await res.json().catch(() => null);
    if (!data?.playlist) {
      return thunkAPI.rejectWithValue("Malformed response: missing playlist");
    }

    data.playlist.slides = Array.isArray(data.playlist.slides) ? data.playlist.slides : [];
    return data.playlist as PlaylistDetails;
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    return thunkAPI.rejectWithValue(err?.message || "Network error");
  }
});

const interactiveSlice = createSlice({
  name: "interactive",
  initialState,
  reducers: {
    setSelectedId: (state, action: PayloadAction<number>) => {
      state.selectedId = action.payload;
    },
    /** NEW: toggle edit mode */
    setIsEditing: (state, action: PayloadAction<boolean>) => {  // 👈 add this
      state.isEditing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractiveDetails.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInteractiveDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.details = action.payload;
        console.log("Fetched playlist details:", action.payload);
      })
      .addCase(fetchInteractiveDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch details";
        console.error("Failed to fetch playlist details:", state.error);
      });
  },
});

export const { setSelectedId, setIsEditing } = interactiveSlice.actions; // 👈 export it
export default interactiveSlice.reducer;
