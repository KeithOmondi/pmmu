import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { AppDispatch } from "../store";
import { fetchMyNotifications } from "./notificationsSlice";

/* =========================
   TYPES
========================= */
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

interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/* =========================
   INITIAL STATE
========================= */
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

/* =========================
   UTILITIES
========================= */
const normalizeRole = (role: string): Role => {
  const r = role.toLowerCase();
  if (r === "superadmin") return "SuperAdmin";
  if (r === "admin") return "Admin";
  return "User";
};

/* =========================
   THUNKS
========================= */

/**
 * LOGIN
 * - stores accessToken in localStorage
 * - sets user in redux
 */
export const login = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);

    // ✅ STORE ACCESS TOKEN
    localStorage.setItem("accessToken", data.accessToken);

    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

/**
 * REFRESH USER (optional manual refresh)
 * Axios interceptor already handles refresh automatically
 */
export const refreshUser = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>("auth/refreshUser", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/refresh");

    // ✅ UPDATE ACCESS TOKEN
    localStorage.setItem("accessToken", data.accessToken);

    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Session expired");
  }
});

/**
 * LOGOUT
 * - clears cookies (backend)
 * - clears accessToken (frontend)
 */
export const logout = createAsyncThunk<void, void, { dispatch: AppDispatch }>(
  "auth/logout",
  async (_, { dispatch }) => {
    await api.post("/auth/logout");

    // ✅ REMOVE TOKEN
    localStorage.removeItem("accessToken");

    dispatch(fetchMyNotifications());
  }
);

/* =========================
   SLICE
========================= */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Used on app init to restore auth state
     * if accessToken exists
     */
    setAuthenticated(state) {
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // -----------------
      // LOGIN
      // -----------------
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = {
          ...action.payload.user,
          role: normalizeRole(action.payload.user.role),
        };
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      // -----------------
      // REFRESH USER
      // -----------------
      .addCase(refreshUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = {
          ...action.payload.user,
          role: normalizeRole(action.payload.user.role),
        };
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(refreshUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        localStorage.removeItem("accessToken");
      })

      // -----------------
      // LOGOUT
      // -----------------
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { setAuthenticated } = authSlice.actions;
export default authSlice.reducer;
