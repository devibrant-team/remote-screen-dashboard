// Redux/Slices/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { loginApi, LogoutApi } from "../../API/API";
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
  } catch { return null; }
};

const initialToken = readToken();
attachToken(initialToken);

const initialState: AuthState = {
  isLoggedIn: !!initialToken,
  loading: false,
  error: null,
  token: initialToken,
};

export const loginUser = createAsyncThunk<
  { token: string },
  { email: string; password: string; machineId: string | null },
  { rejectValue: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post<{ token: string }>(loginApi, credentials);
    return { token: data.token };
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? "Login failed";
    return rejectWithValue(msg);
  }
});

/**
 * Logout:
 * - Reads token
 * - Sends it if present
 * - Treats 401/403 as success (already invalid)
 * - Leaves local cleanup to reducers on fulfilled
 */
export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/logoutUser", async (_, { rejectWithValue }) => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // No token? nothing to tell the server—resolve so reducers clear state.
    if (!token) return;

    await api.post(
      LogoutApi,
      {},
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // Token already invalid on server—treat as success so we still clear locally
      return;
    }
    const msg = error?.response?.data?.message ?? "Logout failed";
    return rejectWithValue(msg);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      state.isLoggedIn = !!action.payload;
      attachToken(action.payload);
      try {
        if (action.payload) localStorage.setItem("token", action.payload);
        else localStorage.removeItem("token");
      } catch {}
    },
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
        attachToken(token);
        try { localStorage.setItem("token", token); } catch {}
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.token = null;
        state.error = action.payload ?? "Login failed";
        attachToken(null);
        try { localStorage.removeItem("token"); } catch {}
      })

      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.token = null;
        state.error = null;
        // 🔑 make sure axios stops sending the token
        attachToken(null);
        try { localStorage.removeItem("token"); } catch {}
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // (Optional) If you want to force local logout even on server error, call:
        // state.isLoggedIn = false; state.token = null; attachToken(null); localStorage.removeItem("token");
      });
  },
});

export const { logout, setToken, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectIsLoggedIn  = (s: { auth: AuthState }) => s.auth.isLoggedIn;
export const selectAuthToken   = (s: { auth: AuthState }) => s.auth.token;
export const selectAuthError   = (s: { auth: AuthState }) => s.auth.error;
export const selectAuthLoading = (s: { auth: AuthState }) => s.auth.loading;
