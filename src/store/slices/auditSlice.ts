import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

interface AuditState {
  isNudging: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AuditState = {
  isNudging: false,
  error: null,
  successMessage: null,
};

/* =====================================================
   THUNK: NUDGE ASSIGNEES (Global or Individual)
===================================================== */
export const nudgeOverdueAssignees = createAsyncThunk(
  "audit/nudgeOverdue",
  async (indicatorId: string | undefined, { rejectWithValue }) => {
    try {
      const config = {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      };

      // FIXED URL: Added '/admin' to match your backend route
      // BODY: Passing indicatorId. If undefined, backend handles it as a broadcast.
      const { data } = await api.post(
        `/indicators/remind-overdue`, 
        { indicatorId }, 
        config
      );

      return data.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Internal server error during broadcast"
      );
    }
  }
);

const auditSlice = createSlice({
  name: "audit",
  initialState,
  reducers: {
    resetAuditStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(nudgeOverdueAssignees.pending, (state) => {
        state.isNudging = true;
      })
      .addCase(nudgeOverdueAssignees.fulfilled, (state, action) => {
        state.isNudging = false;
        state.successMessage = action.payload;
      })
      .addCase(nudgeOverdueAssignees.rejected, (state, action) => {
        state.isNudging = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAuditStatus } = auditSlice.actions;
export default auditSlice.reducer;