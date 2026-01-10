import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState } from "../store";

export type ReportType = "single" | "general" | "weekly" | "monthly" | "quarterly" | "group";

export interface ReportRequestPayload {
  type: ReportType;
  id?: string;
  userId?: string;
  group?: string;
  isAdmin?: boolean;
}

interface ReportsState {
  lastReportHtml: string | null;
  lastPdfBlob: Blob | null;
  loading: boolean;
  generating: boolean; 
  error: string | null;
}

const initialState: ReportsState = {
  lastReportHtml: null,
  lastPdfBlob: null,
  loading: false,
  generating: false,
  error: null,
};

const getEndpoint = (payload: ReportRequestPayload, format: "html" | "pdf") => {
  if (payload.id && payload.type === "single") {
    return format === "pdf" ? `/reports/getpdf/pdf/${payload.id}` : `/reports/gethtml/html/${payload.id}`;
  }
  if (payload.isAdmin) return `/reports/admin/get/${format}`;
  return format === "pdf" ? "/reports/userpdf/pdf" : "/reports/userhtml/html";
};

export const fetchReportHtml = createAsyncThunk<string, ReportRequestPayload, { rejectValue: string }>(
  "reports/fetchHtml", 
  async (payload, { rejectWithValue }) => {
    try {
      const endpoint = getEndpoint(payload, "html");
      const { data } = await api.get(endpoint, { params: payload, responseType: "text" });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch HTML preview");
    }
  }
);

export const downloadReportPdf = createAsyncThunk<Blob, ReportRequestPayload, { rejectValue: string }>(
  "reports/downloadPdf", 
  async (payload, { rejectWithValue }) => {
    try {
      const endpoint = getEndpoint(payload, "pdf");
      const { data } = await api.get(endpoint, { params: payload, responseType: "blob" });
      if (data.type === "application/json") {
        const text = await data.text();
        return rejectWithValue(JSON.parse(text).message || "Failed to generate PDF");
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "PDF download failed");
    }
  }
);

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearReportsError: (state) => { state.error = null; },
    clearPdf: (state) => { state.lastPdfBlob = null; },
    clearReportHtml: (state) => { state.lastReportHtml = null; },
    resetReportsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportHtml.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchReportHtml.fulfilled, (state, action) => { state.loading = false; state.lastReportHtml = action.payload; })
      .addCase(downloadReportPdf.pending, (state) => { state.generating = true; state.error = null; })
      .addCase(downloadReportPdf.fulfilled, (state, action) => { state.generating = false; state.lastPdfBlob = action.payload; })
      .addMatcher(
        (action) => action.type.startsWith("reports/") && action.type.endsWith("/rejected"),
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.generating = false;
          state.error = action.payload ?? "An unexpected error occurred";
        }
      );
  },
});

export const { clearReportsError, clearPdf, clearReportHtml, resetReportsState } = reportsSlice.actions;
export default reportsSlice.reducer;

export const selectLastReportHtml = (state: RootState) => state.reports.lastReportHtml;
export const selectLastPdfBlob = (state: RootState) => state.reports.lastPdfBlob;
export const selectReportsLoading = (state: RootState) => state.reports.loading;