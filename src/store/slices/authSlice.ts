import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
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
  avatar?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  accessToken?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isCheckingAuth: boolean;
  isAuthenticated: boolean;
  error: string | null;

  otpSent: boolean;
  otpMessage: string | null;
  otpCooldown: number;

  pjNumber: string | null;
}

/* =========================
   INITIAL STATE
========================= */

const initialState: AuthState = {
  user: null,
  loading: false,
  isCheckingAuth: true,
  isAuthenticated: false,
  error: null,

  otpSent: false,
  otpMessage: null,
  otpCooldown: 0,

  pjNumber: null,
};

/* =========================
   HELPERS
========================= */

const normalizeRole = (role: string): Role => {
  const r = role?.toLowerCase();
  if (r === "superadmin") return "SuperAdmin";
  if (r === "admin") return "Admin";
  return "User";
};

const storeAccessToken = (token?: string) => {
  if (token) localStorage.setItem("accessToken", token);
};

const clearAccessToken = () => {
  localStorage.removeItem("accessToken");
};

/* =========================
   THUNKS
========================= */

/**
 * 🔁 Rehydrate auth using refresh token (cookie-based)
 * Runs once on app mount
 */
export const checkAuthStatus = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>("auth/checkAuthStatus", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/refresh");

    storeAccessToken(data.accessToken);
    return data;
  } catch (err: any) {
    clearAccessToken();
    return rejectWithValue(err.response?.data?.message || "Session expired");
  }
});

/**
 * 📩 Request login OTP
 */
export const requestLoginOtp = createAsyncThunk<
  AuthResponse,
  { pjNumber: string },
  { rejectValue: string }
>("auth/requestLoginOtp", async ({ pjNumber }, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/login/request-otp", {
      pjNumber,
    });
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to request OTP",
    );
  }
});

/**
 * 🔄 Resend OTP
 */
export const resendLoginOtp = createAsyncThunk<
  AuthResponse,
  void,
  { state: { auth: AuthState }; rejectValue: string }
>("auth/resendLoginOtp", async (_, { getState, rejectWithValue }) => {
  const pjNumber = getState().auth.pjNumber;
  if (!pjNumber)
    return rejectWithValue("PJ Number missing. Please restart login.");

  try {
    const { data } = await api.post<AuthResponse>("/auth/login/resend-otp", {
      pjNumber,
    });
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to resend OTP",
    );
  }
});

/**
 * ✅ Verify OTP & receive access token
 */
export const verifyLoginOtp = createAsyncThunk<
  AuthResponse,
  { otp: string },
  { state: { auth: AuthState }; rejectValue: string }
>("auth/verifyLoginOtp", async ({ otp }, { getState, rejectWithValue }) => {
  const pjNumber = getState().auth.pjNumber;
  if (!pjNumber)
    return rejectWithValue("PJ Number missing. Please restart login.");

  try {
    const { data } = await api.post<AuthResponse>("/auth/login/verify-otp", {
      pjNumber,
      otp,
    });

    storeAccessToken(data.accessToken);
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "OTP verification failed",
    );
  }
});

/**
 * 🚪 Logout (invalidate refresh token server-side)
 */
export const logout = createAsyncThunk<void, void, { dispatch: AppDispatch }>(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAccessToken();
      dispatch(fetchMyNotifications());
    }
  },
);

/* =========================
   SLICE
========================= */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    clearOtpMessage(state) {
      state.otpMessage = null;
    },
    resetOtpState(state) {
      state.otpSent = false;
      state.otpMessage = null;
      state.otpCooldown = 0;
      state.pjNumber = null;
    },
    forceLogout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.isCheckingAuth = false;
      state.error = null;
      clearAccessToken();
    },
    setOtpCooldown(state, action: PayloadAction<number>) {
      state.otpCooldown = action.payload;
    },
    decrementOtpCooldown(state) {
      if (state.otpCooldown > 0) state.otpCooldown -= 1;
    },
  },

  extraReducers: (builder) => {
    builder
      /* 🔁 Refresh / Rehydrate */
      .addCase(checkAuthStatus.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = true;
        state.user = action.payload.user
          ? {
              ...action.payload.user,
              role: normalizeRole(action.payload.user.role),
            }
          : null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = false;
        state.user = null;
      })

      /* 📩 Request OTP */
      .addCase(requestLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.otpMessage = action.payload.message;
        state.otpCooldown = 60;
        state.pjNumber = action.meta.arg.pjNumber;
      })
      .addCase(requestLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* ✅ Verify OTP */
      .addCase(verifyLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user
          ? {
              ...action.payload.user,
              role: normalizeRole(action.payload.user.role),
            }
          : null;
        state.pjNumber = null;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* 🚪 Logout */
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  clearAuthError,
  clearOtpMessage,
  resetOtpState,
  setOtpCooldown,
  decrementOtpCooldown,
  forceLogout,
} = authSlice.actions;

export default authSlice.reducer;
