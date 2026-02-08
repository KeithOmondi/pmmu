import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";

/* =========================
   TYPES
========================= */

export interface Log {
  message?: string;
  timestamp?: string;
  level?: string;
  type?: string;
  userId?: string;
  email?: string;
  role?: string;
  loginAt?: string;
  logoutAt?: string;
  durationMinutes?: number;
  [key: string]: any;
}

export interface OnlineUser {
  userId: string;
  email: string;
  role: string;
  loginAt: string;
  ip: string;
  userAgent: string;
  sessionKey: string;
}

interface AdminState {
  logs: Log[];
  onlineUsers: OnlineUser[];
  loading: boolean;
  error: string | null;
}

/* =========================
   INITIAL STATE
========================= */

const initialState: AdminState = {
  logs: [],
  onlineUsers: [],
  loading: false,
  error: null,
};

/* =========================
   ASYNC THUNKS
========================= */

// Fetch activity logs
export const fetchActivityFeed = createAsyncThunk<
  Log[],
  void,
  { rejectValue: string }
>("admin/fetchActivityFeed", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/admin/activity-feed");
    return response.data.logs;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch logs"
    );
  }
});

// Clear activity logs
export const clearActivityFeedAction = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("admin/clearActivityFeed", async (_, { rejectWithValue }) => {
  try {
    await api.delete("/admin/activity-feed/clear");
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to clear logs"
    );
  }
});

// ✅ Fetch currently online users
export const fetchOnlineUsers = createAsyncThunk<
  OnlineUser[],
  void,
  { rejectValue: string }
>("admin/fetchOnlineUsers", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/admin/users/online-users");
    return response.data.users;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch online users"
    );
  }
});

/* =========================
   SLICE
========================= */

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    // For socket.io / SSE real-time logs
    addNewLog: (state, action: PayloadAction<Log>) => {
      state.logs.unshift(action.payload);
      if (state.logs.length > 100) state.logs.pop();
    },

    // Optional: live update online users (socket/SSE)
    setOnlineUsers: (state, action: PayloadAction<OnlineUser[]>) => {
      state.onlineUsers = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ===== ACTIVITY FEED ===== */
      .addCase(fetchActivityFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchActivityFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      /* ===== CLEAR FEED ===== */
      .addCase(clearActivityFeedAction.fulfilled, (state) => {
        state.logs = [];
      })

      /* ===== ONLINE USERS ===== */
      .addCase(fetchOnlineUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOnlineUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.onlineUsers = action.payload;
      })
      .addCase(fetchOnlineUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      });
  },
});

/* =========================
   EXPORTS
========================= */

export const { addNewLog, setOnlineUsers } = adminSlice.actions;
export default adminSlice.reducer;
