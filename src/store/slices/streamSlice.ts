import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState } from "../store";

/* ======================
    TYPES
====================== */
interface StreamState {
  loading: boolean;
  error: string | null;
  previewUrl: string | null;
}

const initialState: StreamState = {
  loading: false,
  error: null,
  previewUrl: null,
};

/* ======================
    THUNK (PROXIED APPROACH)
====================== */
export const fetchEvidencePreviewUrl = createAsyncThunk<
  string, // Returns the local proxy URL
  { indicatorId: string; publicId: string },
  { rejectValue: string }
>(
  "stream/fetchEvidencePreviewUrl",
  async ({ indicatorId, publicId }, { rejectWithValue }) => {
    try {
      /**
       * ROOT FIX: 
       * Instead of asking the backend for a Cloudinary URL, we point the 
       * frontend to our proxy endpoint. We encode the publicId because 
       * it contains slashes that would break the URL path.
       */
      const encodedPublicId = encodeURIComponent(publicId);
      
      // Use the baseURL from your axios instance or an env variable
      const baseUrl = api.defaults.baseURL || "";
      const proxyUrl = `${baseUrl}/indicators/${indicatorId}/proxy-evidence?publicId=${encodedPublicId}`;

      // We return the URL string immediately. 
      // The browser will handle the authentication via 'withCredentials' (cookies) 
      // when the <iframe> or <img> tries to load this src.
      return proxyUrl;
    } catch (err: any) {
      return rejectWithValue("Failed to generate proxy stream link");
    }
  }
);

/* ======================
    SLICE
====================== */
const streamSlice = createSlice({
  name: "stream",
  initialState,
  reducers: {
    clearPreview(state) {
      state.previewUrl = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvidencePreviewUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvidencePreviewUrl.fulfilled, (state, action) => {
        state.loading = false;
        state.previewUrl = action.payload; // This is now your backend's proxy URL
      })
      .addCase(fetchEvidencePreviewUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch preview";
      });
  },
});

export const { clearPreview } = streamSlice.actions;
export default streamSlice.reducer;
export const selectStream = (state: RootState) => state.stream;