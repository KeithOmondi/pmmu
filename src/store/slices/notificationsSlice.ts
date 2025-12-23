import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState } from "../store";

/* =========================================================
   TYPES
========================================================= */

export interface Notification {
  _id: string;
  user?: string;
  title: string;
  message: string;
  read: boolean;
  type?: "system" | "task" | "direct";
  createdAt: string;
  submittedBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  metadata?: Record<string, any>;
}

interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  sending: boolean; // 🔹 sending messages (SuperAdmin)
  error: string | null;
  successMessage: string | null;
}

/* =========================================================
   INITIAL STATE
========================================================= */

const initialState: NotificationsState = {
  notifications: [],
  loading: false,
  sending: false,
  error: null,
  successMessage: null,
};

/* =========================================================
   THUNKS – FETCH
========================================================= */

// User inbox
export const fetchMyNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>("notifications/fetchMy", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/notifications/my");
    return data.notifications;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch notifications"
    );
  }
});

// Admin / SuperAdmin
export const fetchAllNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>("notifications/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/notifications/all");
    return data.notifications;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch all notifications"
    );
  }
});

/* =========================================================
   THUNKS – READ
========================================================= */

export const markNotificationAsRead = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notifications/markRead", async (id, { rejectWithValue }) => {
  try {
    await api.patch(`/notifications/mark/${id}/read`);
    return id;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to mark as read"
    );
  }
});

/* =========================================================
   THUNKS – SUPER ADMIN SEND
========================================================= */

// Broadcast
export const broadcastNotification = createAsyncThunk<
  void,
  { title: string; message: string },
  { rejectValue: string }
>("notifications/broadcast", async (payload, { rejectWithValue }) => {
  try {
    await api.post("/notifications/broadcast", payload);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Broadcast failed");
  }
});

// Single user
export const sendNotificationToUser = createAsyncThunk<
  void,
  { userId: string; title: string; message: string },
  { rejectValue: string }
>("notifications/sendUser", async (payload, { rejectWithValue }) => {
  try {
    await api.post("/notifications/send/user", payload);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to send message"
    );
  }
});

// Group
export const sendNotificationToGroup = createAsyncThunk<
  void,
  { userIds: string[]; title: string; message: string },
  { rejectValue: string }
>("notifications/sendGroup", async (payload, { rejectWithValue }) => {
  try {
    await api.post("/notifications/send/group", payload);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to send group message"
    );
  }
});

// By criteria (role / department)
export const sendNotificationByCriteria = createAsyncThunk<
  void,
  { role?: string; department?: string; title: string; message: string },
  { rejectValue: string }
>("notifications/sendCriteria", async (payload, { rejectWithValue }) => {
  try {
    await api.post("/notifications/send/criteria", payload);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to send notification"
    );
  }
});

/* =========================================================
   SLICE
========================================================= */

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotificationsError(state) {
      state.error = null;
    },
    clearNotificationsSuccess(state) {
      state.successMessage = null;
    },
    // 🔹 Used by socket.io real-time events
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    /* ---------- Fetch ---------- */
    builder
      .addCase(fetchMyNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchAllNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      });

    /* ---------- Read ---------- */
    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const notif = state.notifications.find((n) => n._id === action.payload);
      if (notif) notif.read = true;
    });

    /* ---------- Send (SuperAdmin) ---------- */
    builder
      .addMatcher(
        (a) =>
          a.type.startsWith("notifications/send") ||
          a.type.includes("broadcast"),
        (state) => {
          state.sending = true;
          state.error = null;
          state.successMessage = null;
        }
      )
      .addMatcher(
        (a) =>
          (a.type.startsWith("notifications/send") ||
            a.type.includes("broadcast")) &&
          a.type.endsWith("/fulfilled"),
        (state) => {
          state.sending = false;
          state.successMessage = "Notification sent successfully";
        }
      );

    /* ---------- Errors ---------- */
    builder.addMatcher(
      (a) =>
        a.type.startsWith("notifications/") && a.type.endsWith("/rejected"),
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.sending = false;
        state.error = action.payload ?? "Something went wrong";
      }
    );
  },
});

/* =========================================================
   EXPORTS
========================================================= */

export const {
  clearNotificationsError,
  clearNotificationsSuccess,
  addNotification,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

/* =========================================================
   SELECTORS
========================================================= */

export const selectNotifications = (state: RootState) =>
  state.notifications.notifications;

export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter((n) => !n.read).length;

export const selectNotificationsLoading = (state: RootState) =>
  state.notifications.loading;

export const selectNotificationsSending = (state: RootState) =>
  state.notifications.sending;

export const selectNotificationsError = (state: RootState) =>
  state.notifications.error;

export const selectNotificationsSuccess = (state: RootState) =>
  state.notifications.successMessage;
