import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";
import api from "../../api/axios";
import { addNotification } from "./notificationsSlice";
import type { AxiosError } from "axios";

/* =====================================================
    DOMAIN & PAYLOAD TYPES
===================================================== */

export type IndicatorStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "completed"
  | "rejected"
  | "overdue";

export type AssignedToType = "individual" | "group";

export interface INote {
  text: string;
  createdBy: string | null;
  createdAt: string;
}

export interface IEvidence {
  _id: string;
  type: "file";
  fileName: string;
  fileSize: number;
  mimeType: string;
  publicId: string;
  resourceType: "raw" | "image" | "video";
  cloudinaryType: "authenticated";
  format: string;
  description?: string;
}

export interface ICategoryRef {
  _id: string;
  title: string;
}

export interface IIndicator {
  _id: string;
  indicatorTitle: string;
  category: ICategoryRef | null;
  level2Category: ICategoryRef | null;
  unitOfMeasure: string;
  assignedToType: AssignedToType;
  assignedTo: string | null;
  assignedGroup: string[];
  startDate: string;
  dueDate: string;
  progress: number;
  status: IndicatorStatus;
  rejectionCount: number;
  result?: "pass" | "fail" | null;
  notes: INote[];
  evidence: IEvidence[];
  createdBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  calendarEvent?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIndicatorPayload {
  categoryId: string;
  level2CategoryId: string;
  indicatorId: string;
  unitOfMeasure: string;
  assignedToType: AssignedToType;
  assignedTo?: string | null;
  assignedGroup?: string[];
  startDate: string;
  dueDate: string;
  calendarEvent?: Record<string, unknown>;
}

export interface UpdateIndicatorPayload {
  id: string;
  updates: Partial<IIndicator>;
}

export interface SubmitEvidencePayload {
  id: string;
  files: File[];
  descriptions?: string[];
}

export interface UpdateProgressPayload {
  id: string;
  progress: number;
}

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

const updateList = (list: IIndicator[], updated: IIndicator) =>
  list.map((i) => (i._id === updated._id ? updated : i));

/**
 * Normalize API payload into frontend-safe shape
 * NOTE: preview URLs are NOT persisted here
 */
const normalizeIndicator = (raw: any): IIndicator => ({
  ...raw,
  indicatorTitle: raw.indicatorTitle ?? "",
  assignedTo: raw.assignedTo?._id ?? raw.assignedTo ?? null,
  assignedGroup: Array.isArray(raw.assignedGroup)
    ? raw.assignedGroup.map((g: any) => g._id ?? g)
    : [],
  notes: (raw.notes || []).map((n: any) => ({
    ...n,
    createdBy: n.createdBy?._id ?? n.createdBy ?? null,
  })),
  evidence: (raw.evidence || []).map((e: any) => ({
    ...e,
    type: "file",
    version: e.version ?? 0, // ✅ default version
  })),
});

/* =====================================================
    SLICE STATE
===================================================== */

interface IndicatorState {
  userIndicators: IIndicator[];
  allIndicators: IIndicator[];
  submittedIndicators: IIndicator[];
  loading: boolean;
  submittingEvidence: boolean;
  previewUrls: Record<string, string>; // publicId → signed URL
  error: string | null;
}

const initialState: IndicatorState = {
  userIndicators: [],
  allIndicators: [],
  submittedIndicators: [],
  loading: false,
  submittingEvidence: false,
  previewUrls: {},
  error: null,
};

/* =====================================================
    THUNKS
===================================================== */

export const fetchAllIndicatorsForAdmin = createAsyncThunk<
  IIndicator[],
  void,
  { rejectValue: string }
>("indicators/all", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/indicators/all");
    return data.indicators.map(normalizeIndicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Fetch failed"));
  }
});

export const fetchUserIndicators = createAsyncThunk<
  IIndicator[],
  void,
  { rejectValue: string }
>("indicators/my", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/indicators/my");
    return data.indicators.map(normalizeIndicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Fetch failed"));
  }
});

export const fetchSubmittedIndicators = createAsyncThunk<
  IIndicator[],
  void,
  { rejectValue: string }
>("indicators/submitted", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/indicators/submitted");
    return data.indicators.map(normalizeIndicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Fetch submitted failed"));
  }
});

export const createIndicator = createAsyncThunk<
  IIndicator,
  CreateIndicatorPayload,
  { rejectValue: string }
>("indicators/create", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.post("/indicators/create", payload);
    dispatch(
      addNotification(
        createNotif("Success", "Indicator created successfully."),
      ),
    );
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Creation failed"));
  }
});

export const updateIndicator = createAsyncThunk<
  IIndicator,
  UpdateIndicatorPayload,
  { rejectValue: string }
>(
  "indicators/update",
  async ({ id, updates }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/indicators/update/${id}`, updates);
      dispatch(
        addNotification(
          createNotif("Success", "Indicator updated successfully."),
        ),
      );
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Update failed"));
    }
  },
);

export const approveIndicator = createAsyncThunk<
  IIndicator,
  { id: string; notes?: string },
  { rejectValue: string }
>(
  "indicators/approve",
  async ({ id, notes }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/indicators/approve/${id}`, { notes });
      const indicator = normalizeIndicator(data.indicator);
      dispatch(
        addNotification(
          createNotif(
            indicator.status === "completed" ? "Finalized" : "Verified",
            indicator.status === "completed"
              ? "Record archived as completed."
              : "Record verified; pending ratification.",
          ),
        ),
      );
      return indicator;
    } catch (err) {
      return rejectWithValue(handleError(err, "Approval failed"));
    }
  },
);

export const rejectIndicator = createAsyncThunk<
  IIndicator,
  { id: string; notes: string },
  { rejectValue: string }
>("indicators/reject", async ({ id, notes }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/reject/${id}`, { notes });
    dispatch(
      addNotification(createNotif("Returned", "Sent back for corrections.")),
    );
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Rejection failed"));
  }
});

export const deleteIndicator = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("indicators/delete", async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/indicators/delete/${id}`);
    dispatch(addNotification(createNotif("Purged", "Indicator removed.")));
    return id;
  } catch (err) {
    return rejectWithValue(handleError(err, "Deletion failed"));
  }
});

export const updateIndicatorProgress = createAsyncThunk<
  IIndicator,
  UpdateProgressPayload,
  { rejectValue: string }
>("indicators/progress", async ({ id, progress }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/indicators/${id}/progress`, {
      progress,
    });
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Progress update failed"));
  }
});

export const submitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  SubmitEvidencePayload,
  { rejectValue: string }
>(
  "indicators/submit",
  async ({ id, files, descriptions = [] }, { dispatch, rejectWithValue }) => {
    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      descriptions.forEach((d) => form.append("descriptions", d));

      const { data } = await api.post(`/indicators/submit/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      dispatch(
        addNotification(
          createNotif("Evidence Logged", "Files uploaded successfully."),
        ),
      );
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Submission failed"));
    }
  },
);

export const fetchEvidencePreviewUrl = createAsyncThunk<
  { publicId: string; previewUrl: string; version: number },
  { indicatorId: string; publicId: string },
  {
    state: RootState;
    rejectValue: string;
  }
>(
  "indicators/fetchPreviewUrl",
  async ({ indicatorId, publicId }, { getState, rejectWithValue }) => {
    try {
      // 🔒 HARD DEDUPE
      const existing = getState().indicators.previewUrls[publicId];
      if (existing) {
        return {
          publicId,
          previewUrl: existing,
          version: 0,
        };
      }

      const response = await api.get(
        `/indicators/${indicatorId}/preview-evidence`,
        { params: { publicId } },
      );

      const baseUrl: string = response.data?.url;
      const rawVersion = response.data?.version;

      // 👀 make the version explicit
      const version =
        typeof rawVersion === "number"
          ? rawVersion
          : Number(rawVersion) || 0;

      // 👀 build URL step-by-step
      const previewUrl = `${baseUrl}?v=${version}`;

      // 🔍 optional: temporary debug
      console.debug("[Preview URL]", {
        publicId,
        baseUrl,
        rawVersion,
        version,
        previewUrl,
      });

      return {
        publicId,
        previewUrl,
        version,
      };
    } catch (err) {
      return rejectWithValue(handleError(err, "Failed to fetch preview URL"));
    }
  },
);


/* =====================================================
    SLICE
===================================================== */

const indicatorSlice = createSlice({
  name: "indicators",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
    },
    clearPreviewUrls: (state) => {
      state.previewUrls = {};
    },
    // Add this one:
    removeSpecificPreviewUrl: (state, action: PayloadAction<string>) => {
      delete state.previewUrls[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllIndicatorsForAdmin.fulfilled, (state, action) => {
        state.allIndicators = action.payload;
      })
      .addCase(fetchUserIndicators.fulfilled, (state, action) => {
        state.userIndicators = action.payload;
      })
      .addCase(fetchSubmittedIndicators.fulfilled, (state, action) => {
        state.submittedIndicators = action.payload;
      })
      .addCase(createIndicator.fulfilled, (state, action) => {
        state.allIndicators.unshift(action.payload);
      })
      .addCase(deleteIndicator.fulfilled, (state, action) => {
        const id = action.payload;
        state.allIndicators = state.allIndicators.filter((i) => i._id !== id);
        state.userIndicators = state.userIndicators.filter((i) => i._id !== id);
        state.submittedIndicators = state.submittedIndicators.filter(
          (i) => i._id !== id,
        );
      })
      .addCase(submitIndicatorEvidence.pending, (state) => {
        state.submittingEvidence = true;
      })
      .addCase(submitIndicatorEvidence.fulfilled, (state, action) => {
        state.submittingEvidence = false;
        state.allIndicators = updateList(state.allIndicators, action.payload);
        state.userIndicators = updateList(state.userIndicators, action.payload);
        state.submittedIndicators = updateList(
          state.submittedIndicators,
          action.payload,
        );
      })
      .addCase(submitIndicatorEvidence.rejected, (state) => {
        state.submittingEvidence = false;
      })
      .addCase(fetchEvidencePreviewUrl.fulfilled, (state, action) => {
        state.previewUrls[action.payload.publicId] = action.payload.previewUrl;
      })

      .addMatcher(
        (action): action is PayloadAction<IIndicator> =>
          action.type.endsWith("/update/fulfilled") ||
          action.type.endsWith("/approve/fulfilled") ||
          action.type.endsWith("/reject/fulfilled") ||
          action.type.endsWith("/progress/fulfilled"),
        (state, action) => {
          state.allIndicators = updateList(state.allIndicators, action.payload);
          state.userIndicators = updateList(
            state.userIndicators,
            action.payload,
          );
          state.submittedIndicators = updateList(
            state.submittedIndicators,
            action.payload,
          );
        },
      )
      .addMatcher(
        (action) =>
          action.type.endsWith("/pending") && !action.type.includes("submit"),
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.endsWith("/fulfilled") ||
          action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          if (action.type.endsWith("/rejected")) {
            state.error = action.payload || "An unexpected error occurred";
          }
        },
      );
  },
});

export const { clearMessages, clearPreviewUrls, removeSpecificPreviewUrl } =
  indicatorSlice.actions;

/* =====================================================
    SELECTORS
===================================================== */

export const selectUserIndicators = (s: RootState) =>
  s.indicators.userIndicators;
export const selectAllIndicators = (s: RootState) => s.indicators.allIndicators;
export const selectSubmittedIndicators = (s: RootState) =>
  s.indicators.submittedIndicators;
export const selectIndicatorsLoading = (s: RootState) => s.indicators.loading;
export const selectIndicatorsError = (s: RootState) => s.indicators.error;
export const selectSubmittingEvidence = (s: RootState) =>
  s.indicators.submittingEvidence;
export const selectPreviewUrls = (s: RootState) => s.indicators.previewUrls;

export default indicatorSlice.reducer;
