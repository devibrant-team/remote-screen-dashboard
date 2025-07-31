// Redux/Slices/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { loginApi  } from "../../API/API";

interface AuthState {
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
}

const initialState: AuthState = {
  isLoggedIn: !!localStorage.getItem("token"),
  loading: false,
  error: null,
  token: localStorage.getItem("token"),
};

// ✅ Login thunk
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: { email: string; password: string , machineId:string | null }, thunkAPI) => {
    try {
      const response = await axios.post(loginApi, credentials);
      const token = response.data.token;
      localStorage.setItem("token", token);
      return token;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Optional: manual logout without API
    logout(state) {
      state.isLoggedIn = false;
      state.token = null;
      localStorage.removeItem("token");
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
        state.loading = false;
        state.isLoggedIn = true;
        state.token = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.token = null;
        state.error = action.payload as string;
      })

 
  },
});


export default authSlice.reducer;
