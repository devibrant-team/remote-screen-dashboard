// Redux/Slices/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { loginApi } from "../../API/API";
import { api, attachToken } from "./authhelper";

interface AuthState {
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
}

const readToken = () => {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("token") : null;
  } catch {
    return null;
  }
};

const initialToken = readToken();
attachToken(initialToken); // <- central token handling on startup

const initialState: AuthState = {
  isLoggedIn: !!initialToken,
  loading: false,
  error: null,
  token: initialToken,
};

// ✅ Login thunk (no localStorage here; reducers handle side effects)
export const loginUser = createAsyncThunk<
  { token: string },                                 // return
  { email: string; password: string; machineId: string | null }, // args
  { rejectValue: string }                            // reject payload
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post<{ token: string }>(loginApi, credentials);
    return { token: data.token };
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? "Login failed";
    return rejectWithValue(msg);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Allow programmatic token updates (e.g., refresh interceptor)
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      state.isLoggedIn = !!action.payload;
      attachToken(action.payload);
      try {
        if (action.payload) localStorage.setItem("token", action.payload);
        else localStorage.removeItem("token");
      } catch {}
    },

    // Manual logout
    logout(state) {
      state.isLoggedIn = false;
      state.token = null;
      state.error = null;
      attachToken(null);
      try { localStorage.removeItem("token"); } catch {}
    },

    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const token = action.payload.token;
        state.loading = false;
        state.isLoggedIn = true;
        state.token = token;
        state.error = null;

        // 🔑 Central token handling + persistence
        attachToken(token);
        try { localStorage.setItem("token", token); } catch {}
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.token = null;
        state.error = action.payload ?? "Login failed";

        // ensure header/storage are cleared
        attachToken(null);
        try { localStorage.removeItem("token"); } catch {}
      });
  },
});

export const { logout, setToken, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

// (Optional) selectors
export const selectIsLoggedIn = (s: { auth: AuthState }) => s.auth.isLoggedIn;
export const selectAuthToken  = (s: { auth: AuthState }) => s.auth.token;
export const selectAuthError  = (s: { auth: AuthState }) => s.auth.error;
export const selectAuthLoading= (s: { auth: AuthState }) => s.auth.loading;
