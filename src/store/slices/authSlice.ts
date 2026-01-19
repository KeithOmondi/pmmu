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
  error: string | null;
  isAuthenticated: boolean;

  otpSent: boolean;
  otpMessage: string | null;
  otpCooldown: number;

  pjNumber: string | null; // ✅ FIX: persist pjNumber across OTP steps
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  otpSent: false,
  otpMessage: null,
  otpCooldown: 0,

  pjNumber: null, // ✅
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

/* =========================
   THUNKS
========================= */

// 1. REQUEST LOGIN OTP
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
      err.response?.data?.message || "Failed to request OTP"
    );
  }
});

// 2. RESEND LOGIN OTP
export const resendLoginOtp = createAsyncThunk<
  AuthResponse,
  void,
  { state: { auth: AuthState }; rejectValue: string }
>("auth/resendLoginOtp", async (_, { getState, rejectWithValue }) => {
  try {
    const pjNumber = getState().auth.pjNumber;

    if (!pjNumber) {
      return rejectWithValue("PJ Number missing. Please restart login.");
    }

    const { data } = await api.post<AuthResponse>("/auth/login/resend-otp", {
      pjNumber,
    });
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to resend OTP"
    );
  }
});

// 3. VERIFY OTP
export const verifyLoginOtp = createAsyncThunk<
  AuthResponse,
  { otp: string },
  { state: { auth: AuthState }; rejectValue: string }
>("auth/verifyLoginOtp", async ({ otp }, { getState, rejectWithValue }) => {
  try {
    const pjNumber = getState().auth.pjNumber;

    if (!pjNumber) {
      return rejectWithValue("PJ Number missing. Please restart login.");
    }

    const { data } = await api.post<AuthResponse>("/auth/login/verify-otp", {
      pjNumber,
      otp,
    });

    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }

    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "OTP verification failed"
    );
  }
});

// 4. REFRESH SESSION
export const refreshUser = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>("auth/refreshUser", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/auth/refresh");

    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }

    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Session expired");
  }
});

// 5. UPDATE PROFILE
export const updateProfile = createAsyncThunk<
  AuthResponse,
  FormData,
  { rejectValue: string }
>("auth/updateProfile", async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.put<AuthResponse>("/users/profile", formData);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Update failed");
  }
});

// 6. LOGOUT
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
      state.pjNumber = null; // ✅ reset login flow
    },
    setOtpCooldown(state, action: PayloadAction<number>) {
      state.otpCooldown = action.payload;
    },
    decrementOtpCooldown(state) {
      if (state.otpCooldown > 0) {
        state.otpCooldown -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      /* --- REQUEST OTP --- */
      .addCase(requestLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.otpMessage = action.payload.message || "OTP sent successfully";
        state.otpCooldown = 60;
        state.pjNumber = action.meta.arg.pjNumber; // ✅ CRITICAL FIX
      })
      .addCase(requestLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* --- RESEND OTP --- */
      .addCase(resendLoginOtp.fulfilled, (state, action) => {
        state.otpMessage = action.payload.message || "OTP resent successfully";
        state.otpCooldown = 60;
      })

      /* --- VERIFY OTP --- */
      .addCase(verifyLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user
          ? {
              ...action.payload.user,
              role: normalizeRole(action.payload.user.role),
            }
          : null;

        state.isAuthenticated = !!action.payload.accessToken;
        state.otpSent = false;
        state.otpMessage = null;
        state.otpCooldown = 0;
        state.pjNumber = null; // ✅ clear after success
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* --- REFRESH --- */
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload.user
          ? {
              ...action.payload.user,
              role: normalizeRole(action.payload.user.role),
            }
          : null;

        state.isAuthenticated = !!action.payload.accessToken;
      })

      /* --- UPDATE PROFILE --- */
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.user) {
          state.user = {
            ...action.payload.user,
            role: normalizeRole(action.payload.user.role),
          };
        }
      })

      /* --- LOGOUT --- */
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.otpSent = false;
        state.otpMessage = null;
        state.otpCooldown = 0;
        state.pjNumber = null;
      });
  },
});

export const {
  clearAuthError,
  clearOtpMessage,
  resetOtpState,
  setOtpCooldown,
  decrementOtpCooldown,
} = authSlice.actions;

export default authSlice.reducer;
