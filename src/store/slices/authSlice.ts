import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export type Role = "SuperAdmin" | "Admin" | "User";

export interface User {
  _id: string;
  name: string;
  email: string;
  pjNumber?: string;
  role: Role;
  accountVerified?: boolean;
  avatar?: any;
}

/* =========================
   LOGIN RESPONSE TYPE
========================= */
interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string; // matches backend
}

/* =========================
   LOGIN THUNK
========================= */
export const login = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

/* =========================
   LOGOUT THUNK
========================= */
export const logout = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

/* =========================
   STATE
========================= */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  accessToken: localStorage.getItem("accessToken"),
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
};

/* =========================
   UTILITY
========================= */
// Normalize backend role string to frontend Role type
const normalizeRole = (role: string): Role => {
  const r = role.toLowerCase();
  if (r === "superadmin") return "SuperAdmin";
  if (r === "admin") return "Admin";
  return "User";
};

/* =========================
   SLICE
========================= */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = {
          ...action.payload.user,
          role: normalizeRole(action.payload.user.role),
        };
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.loading = false;

        // Persist to localStorage
        localStorage.setItem("user", JSON.stringify(state.user));
        localStorage.setItem("accessToken", state.accessToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      // LOGOUT
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;

        // Clear localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
      });
  },
});

export default authSlice.reducer;
