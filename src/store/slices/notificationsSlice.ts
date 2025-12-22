import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState } from "../store";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  submittedBy?: { _id: string; name: string }; // Added submittedBy
}

interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  loading: false,
  error: null,
};

// --------------------
// Thunks
// --------------------

// Fetch current user's notifications
export const fetchMyNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>("notifications/fetchMyNotifications", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<{ notifications: Notification[] }>(
      "/notifications/my"
    );
    return data.notifications;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch notifications"
    );
  }
});

// Fetch all notifications (Admin)
export const fetchAllNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>("notifications/fetchAllNotifications", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<{ notifications: Notification[] }>(
      "/notifications/all"
    );
    return data.notifications;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch all notifications"
    );
  }
});

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk<
  string, // notification id
  string,
  { rejectValue: string }
>("notifications/markAsRead", async (id, { rejectWithValue }) => {
  try {
    await api.patch(`/notifications/mark/${id}/read`);
    return id;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to mark notification as read"
    );
  }
});

// --------------------
// Slice
// --------------------
const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotificationsError(state) {
      state.error = null;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    // Pending / Rejected common handlers
    const pendingHandler = (state: NotificationsState) => {
      state.loading = true;
      state.error = null;
    };
    const rejectedHandler = (
      state: NotificationsState,
      action: PayloadAction<any>
    ) => {
      state.loading = false;
      state.error = action.payload ?? "Something went wrong";
    };

    builder
      // Fetch My Notifications
      .addCase(fetchMyNotifications.pending, pendingHandler)
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchMyNotifications.rejected, rejectedHandler)

      // Fetch All Notifications (Admin)
      .addCase(fetchAllNotifications.pending, pendingHandler)
      .addCase(fetchAllNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchAllNotifications.rejected, rejectedHandler)

      // Mark As Read
      .addCase(
        markNotificationAsRead.fulfilled,
        (state, action: PayloadAction<string>) => {
          const notif = state.notifications.find(
            (n) => n._id === action.payload
          );
          if (notif) notif.read = true;
        }
      );
  },
});

export const { clearNotificationsError, addNotification } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;

// --------------------
// Selectors
// --------------------
export const selectAllNotifications = (state: RootState) =>
  state.notifications.notifications;

export const selectUnreadCount = (state: RootState) =>
  Array.isArray(state.notifications.notifications)
    ? state.notifications.notifications.filter((n) => !n.read).length
    : 0;

export const selectNotificationsLoading = (state: RootState) =>
  state.notifications.loading;

export const selectNotificationsError = (state: RootState) =>
  state.notifications.error;
