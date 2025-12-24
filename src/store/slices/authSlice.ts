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
  avatar?: string; // Stores the secure_url string from Cloudinary
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

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

/**
 * Ensures roles are always stored in the correct casing in Redux
 */
const normalizeRole = (role: string): Role => {
  const r = role?.toLowerCase();
  if (r === "superadmin") return "SuperAdmin";
  if (r === "admin") return "Admin";
  return "User";
};

/* =========================
   THUNKS
========================= */

// 1. LOGIN
export const login = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    localStorage.setItem("accessToken", data.accessToken);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

// 2. REFRESH SESSION
export const refreshUser = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>("auth/refreshUser", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/refresh");
    localStorage.setItem("accessToken", data.accessToken);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Session expired");
  }
});

// 3. UPDATE PROFILE
export const updateProfile = createAsyncThunk<
  AuthResponse,
  FormData,
  { rejectValue: string }
>("auth/updateProfile", async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.put<AuthResponse>("/users/profile", formData);
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Registry synchronization failed"
    );
  }
});

// 4. LOGOUT
export const logout = createAsyncThunk<void, void, { dispatch: AppDispatch }>(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      dispatch(fetchMyNotifications());
    }
  }
);

/* =========================
   SLICE
========================= */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated(state) {
      state.isAuthenticated = true;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* --- LOGIN --- */
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          ...action.payload.user,
          role: normalizeRole(action.payload.user.role),
        };
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* --- REFRESH --- */
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          ...action.payload.user,
          role: normalizeRole(action.payload.user.role),
        };
        state.isAuthenticated = true;
      })

      /* --- UPDATE PROFILE --- */
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Logic: Merge the returned user data into the existing state
        if (action.payload.success && action.payload.user) {
          state.user = {
            ...action.payload.user,
            role: normalizeRole(action.payload.user.role),
          };
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* --- LOGOUT --- */
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { setAuthenticated, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
