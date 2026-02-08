import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import api from "../../../api/axios";
import { addNotification } from "../notificationsSlice";
import type { AxiosError } from "axios";

import type {
  IIndicator,
  SubmitEvidencePayload,
} from "./types";

import { normalizeIndicator } from "./normalizers";

/* =====================================================
   HELPERS
===================================================== */

const handleError = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "isAxiosError" in err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    return axiosErr.response?.data?.message ?? fallback;
  }
  return (err as Error)?.message ?? fallback;
};

const createNotif = (title: string, message: string) => ({
  _id: `notif-${Date.now()}`,
  title,
  message,
  read: false,
  createdAt: new Date().toISOString(),
});

/* =====================================================
   STATE
===================================================== */

interface EvidenceState {
  previewUrls: Record<string, string>;
  uploading: boolean;
  error: string | null;
}

const initialState: EvidenceState = {
  previewUrls: {},
  uploading: false,
  error: null,
};

/* =====================================================
   THUNKS — EVIDENCE
===================================================== */

export const submitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  SubmitEvidencePayload,
  { rejectValue: string }
>("indicatorEvidence/submit", async ({ id, files, descriptions = [] }, { dispatch, rejectWithValue }) => {
  try {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    descriptions.forEach((d) => form.append("descriptions", d ?? ""));

    const { data } = await api.post(`/indicators/submit/${id}`, form);

    dispatch(addNotification(createNotif("Evidence Logged", "Files uploaded.")));

    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Submission failed"));
  }
});

export const adminSubmitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { indicatorId: string; files: File[]; descriptions: string[] },
  { rejectValue: string }
>("indicatorEvidence/adminSubmit", async ({ indicatorId, files, descriptions }, { dispatch, rejectWithValue }) => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    descriptions.forEach((desc) => formData.append("descriptions", desc));

    const { data } = await api.post(
      `/admin/indicators/${indicatorId}/evidence`,
      formData,
    );

    dispatch(
      addNotification(
        createNotif("Admin Upload", "Evidence bypass completed."),
      ),
    );

    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Admin upload failed"));
  }
});

export const deleteIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { indicatorId: string; publicId: string },
  { rejectValue: string }
>("indicatorEvidence/delete", async ({ indicatorId, publicId }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.delete(
      `/indicators/${indicatorId}/evidence/${publicId}`,
    );

    dispatch(
      addNotification(
        createNotif("Removed", "Evidence file deleted."),
      ),
    );

    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Delete evidence failed"));
  }
});

export const fetchEvidencePreviewUrl = createAsyncThunk<
  { cacheKey: string; previewUrl: string },
  { indicatorId: string; publicId: string; version: number },
  { state: RootState; rejectValue: string }
>(
  "indicatorEvidence/preview",
  async ({ indicatorId, publicId, version }, { getState, rejectWithValue }) => {
    try {
      const cacheKey = `${publicId}@v${version}`;

      const existing =
        getState().indicatorEvidence.previewUrls[cacheKey];

      if (existing) return { cacheKey, previewUrl: existing };

      const { data } = await api.get(
        `/indicators/${indicatorId}/preview-evidence`,
        {
          params: { publicId, version },
          withCredentials: true,
        },
      );

      return { cacheKey, previewUrl: data.url };
    } catch (err) {
      return rejectWithValue(handleError(err, "Preview failed"));
    }
  },
);

/* =====================================================
   SLICE
===================================================== */

const evidenceSlice = createSlice({
  name: "indicatorEvidence",
  initialState,
  reducers: {
    clearPreviewUrls: (state) => {
      state.previewUrls = {};
    },
    removeSpecificPreviewUrl: (state, action: PayloadAction<string>) => {
      delete state.previewUrls[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvidencePreviewUrl.fulfilled, (s, a) => {
        s.previewUrls[a.payload.cacheKey] = a.payload.previewUrl;
      })
      .addMatcher(
        (a) => a.type.startsWith("indicatorEvidence/") && a.type.endsWith("/pending"),
        (s) => {
          s.uploading = true;
          s.error = null;
        },
      )
      .addMatcher(
        (a) =>
          a.type.startsWith("indicatorEvidence/") &&
          (a.type.endsWith("/fulfilled") || a.type.endsWith("/rejected")),
        (s, a: any) => {
          s.uploading = false;
          if (a.type.endsWith("/rejected")) {
            s.error = a.payload || "Unexpected error";
          }
        },
      );
  },
});

export const {
  clearPreviewUrls,
  removeSpecificPreviewUrl,
} = evidenceSlice.actions;

export default evidenceSlice.reducer;

/* =====================================================
   SELECTORS
===================================================== */

export const selectPreviewUrls = (s: RootState) =>
  s.indicatorEvidence.previewUrls;

export const selectEvidenceUploading = (s: RootState) =>
  s.indicatorEvidence.uploading;

export const selectEvidenceError = (s: RootState) =>
  s.indicatorEvidence.error;
