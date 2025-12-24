import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface Log {
  message: string;
  timestamp: string;
  level: string;
  [key: string]: any;
}

interface AdminState {
  logs: Log[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  logs: [],
  loading: false,
  error: null,
};

// AsyncThunk to fetch logs
export const fetchActivityFeed = createAsyncThunk(
  'admin/fetchActivityFeed',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/activity-feed');
      return response.data.logs; // This matches your controller's JSON structure
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch logs');
    }
  }
);

// AsyncThunk to clear logs
export const clearActivityFeedAction = createAsyncThunk(
  'admin/clearActivityFeed',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/admin/activity-feed/clear');
      return []; // Return empty array to reset state
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to clear logs');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    // Optional: If you use Socket.io to push a single new log, use this
    addNewLog: (state, action) => {
      state.logs.unshift(action.payload); // Add to the top
      if (state.logs.length > 100) state.logs.pop(); // Keep it at 100
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cases
      .addCase(fetchActivityFeed.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivityFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchActivityFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Clear Cases
      .addCase(clearActivityFeedAction.fulfilled, (state) => {
        state.logs = [];
      });
  },
});

export const { addNewLog } = adminSlice.actions;
export default adminSlice.reducer;