import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState } from "../store";

/* ======================
   TYPES
====================== */
interface ScoreState {
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
}

const initialState: ScoreState = {
  loading: false,
  error: null,
  success: false,
  message: null,
};

/* ======================
   THUNK: SUBMIT INDICATOR SCORE
====================== */
export const submitIndicatorScore = createAsyncThunk<
  any, // returned data (updated indicator)
  { indicatorId: string; score: number; note?: string },
  { rejectValue: string }
>(
  "score/submitIndicatorScore",
  async ({ indicatorId, score, note }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/indicators/submit-score/${indicatorId}`, {
        score,
        note,
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit score");
    }
  }
);

/* ======================
   SLICE
====================== */
const scoreSlice = createSlice({
  name: "score",
  initialState,
  reducers: {
    resetScoreState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitIndicatorScore.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitIndicatorScore.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || "Score submitted successfully";
      })
      .addCase(submitIndicatorScore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to submit score";
        state.success = false;
      });
  },
});

export const { resetScoreState } = scoreSlice.actions;
export default scoreSlice.reducer;
export const selectScore = (state: RootState) => state.score;
