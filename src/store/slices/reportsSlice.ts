// src/store/slices/reportsSlice.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";
import api from "../../api/axios";

// --- DTOs ---
export type ReportType =
  | "single"
  | "general"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "group";

export interface ReportRequestPayload {
  type: ReportType;
  id?: string; // for single indicator
  group?: string; // for group reports
}

// --- Async Thunks ---
// Fetch HTML report
export const fetchReportHtml = createAsyncThunk<
  string,
  ReportRequestPayload,
  { rejectValue: string }
>("reports/fetchHtml", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.get("/reports/html", {
      params: payload,
      responseType: "text",
    });
    return response.data as string;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || "Failed to fetch HTML report"
    );
  }
});

// Fetch PDF report
export const downloadReportPdf = createAsyncThunk<
  Blob,
  ReportRequestPayload,
  { rejectValue: string }
>("reports/downloadPdf", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.get("/reports/pdf", {
      params: payload,
      responseType: "blob", // important for binary data
    });
    return response.data as Blob;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || "Failed to download PDF report"
    );
  }
});

// --- Slice ---
interface ReportsState {
  loading: boolean;
  error: string | null;
  lastReportHtml: string | null;
  lastPdfBlob: Blob | null;
}

const initialState: ReportsState = {
  loading: false,
  error: null,
  lastReportHtml: null,
  lastPdfBlob: null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearReportHtml(state) {
      state.lastReportHtml = null;
    },
    clearPdf(state) {
      state.lastPdfBlob = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // HTML report
    builder
      .addCase(fetchReportHtml.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.lastReportHtml = null;
      })
      .addCase(
        fetchReportHtml.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.lastReportHtml = action.payload;
        }
      )
      .addCase(
        fetchReportHtml.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload ?? "Failed to fetch HTML report";
        }
      );

    // PDF report
    builder
      .addCase(downloadReportPdf.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.lastPdfBlob = null;
      })
      .addCase(
        downloadReportPdf.fulfilled,
        (state, action: PayloadAction<Blob>) => {
          state.loading = false;
          state.lastPdfBlob = action.payload;
        }
      )
      .addCase(
        downloadReportPdf.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload ?? "Failed to download PDF report";
        }
      );
  },
});

export const { clearReportHtml, clearPdf, clearError } = reportsSlice.actions;

// --- Selectors ---
export const selectReportsLoading = (state: RootState) => state.reports.loading;
export const selectReportsError = (state: RootState) => state.reports.error;
export const selectLastReportHtml = (state: RootState) =>
  state.reports.lastReportHtml;
export const selectLastPdfBlob = (state: RootState) =>
  state.reports.lastPdfBlob;

export default reportsSlice.reducer;
