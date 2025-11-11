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
  layoutId: number | null;
}

interface InteractiveState {
  selectedId: number | null;
  details: PlaylistDetails | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isEditing: boolean;
  layoutId: number | null;
}

const initialState: InteractiveState = {
  selectedId: null,
  details: null,
  status: "idle",
  error: null,
  isEditing: false,
  layoutId: null,
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

    const p = data.playlist;

    // Normalize fields here
    const layoutId =
      p.layoutId ?? p.style_id ?? p.styleId ?? null;

    const normalized: PlaylistDetails = {
      id: Number(p.id),
      name: String(p.name ?? ""),
      slide_number: Number(p.slide_number ?? 0),
      style: String(p.style ?? ""),
      layoutId,
      slides: Array.isArray(p.slides) ? p.slides : [],
    };

    return normalized;
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
    setIsEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },
        setLayoutId: (state, action: PayloadAction<number | null>) => {
      state.layoutId = action.payload;
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
        // Ensure slides array exists
        state.details.slides = Array.isArray(state.details.slides)
          ? state.details.slides
          : [];
        console.log("Fetched playlist details:", state.details);
      })
      .addCase(fetchInteractiveDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch details";
        console.error("Failed to fetch playlist details:", state.error);
      });
  },
});

export const selectInteractiveLayoutId = (s: { interactive: InteractiveState }) =>
  s.interactive.details?.layoutId ?? s.interactive.layoutId ?? null;

export const { setSelectedId, setIsEditing , setLayoutId} = interactiveSlice.actions;
export default interactiveSlice.reducer;
