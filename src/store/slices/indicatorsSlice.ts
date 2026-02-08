import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/axios";
import { addNotification } from "./notificationsSlice";
import type { AxiosError } from "axios";
import type { RootState } from "../store";

/* =====================================================
   DOMAIN TYPES
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
  
  // This MUST include the folder path (e.g., "indicators/evidence/ID/file")
  publicId: string; 
  
  version: number;
  
  // "raw" is critical for PDFs and Docs in Cloudinary
  resourceType: "image" | "video" | "raw" | "auto"; 
  cloudinaryType: "authenticated";
  format: string;
  description?: string;

  status?: "active" | "archived"; 
  isArchived: boolean;
  
  // Aligned with your backend buildEvidence helper
  resubmissionAttempt: number; 
   attempt?: number;
  
  isResubmission: boolean;
  archivedAt?: string; 
  
  // This is temporary frontend state, never persisted in DB
  previewUrl: string; 

  // Use string for frontend dates to avoid Hydration issues
  createdAt: string; 
  updatedAt?: string;
  uploadedAt?: string; 
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
    // CRITICAL FIX: Do NOT use e.url here. 
    // Leave it empty so the UI knows it needs to fetch a signed URL.
    previewUrl: "", 
    isArchived: e.isArchived ?? false,
    resubmissionAttempt: e.attempt ?? 1,
    createdAt: e.createdAt || e.uploadedAt || new Date().toISOString(),
  })),
});



/* =====================================================
   STATE
===================================================== */

interface IndicatorState {
  userIndicators: IIndicator[];
  allIndicators: IIndicator[];
  submittedIndicators: IIndicator[];
  loading: boolean;
  submittingEvidence: boolean;
  previewUrls: Record<string, string>;
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
    dispatch(addNotification(createNotif("Success", "Indicator created.")));
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
      dispatch(addNotification(createNotif("Success", "Indicator updated.")));
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
      dispatch(addNotification(createNotif("Verified", "Indicator approved.")));
      return normalizeIndicator(data.indicator);
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
    dispatch(addNotification(createNotif("Returned", "Sent for correction.")));
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Rejection failed"));
  }
});

export const deleteIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { indicatorId: string; publicId: string },
  { rejectValue: string }
>(
  "indicators/deleteEvidence",
  async ({ indicatorId, publicId }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.delete(
        `/indicators/${indicatorId}/evidence/${publicId}`,
      );
      dispatch(
        addNotification(createNotif("Removed", "Evidence file deleted.")),
      );
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Delete evidence failed"));
    }
  },
);

export const deleteIndicator = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("indicators/delete", async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/indicators/delete/${id}`);
    dispatch(addNotification(createNotif("Removed", "Indicator deleted.")));
    return id;
  } catch (err) {
    return rejectWithValue(handleError(err, "Deletion failed"));
  }
});

// SUBMIT EVIDENCE (Regular)
export const submitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { id: string; files: File[]; descriptions: string[] },
  { rejectValue: string }
>(
  "indicators/submitEvidence",
  async ({ id, files, descriptions }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      descriptions.forEach((desc) => formData.append("descriptions", desc));

      const { data } = await api.post(`/indicators/submit/${id}`, formData);
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Upload failed"));
    }
  },
);

// RESUBMIT EVIDENCE (Rejected correction)
export const resubmitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { id: string; files: File[]; descriptions: string[]; notes?: string },
  { rejectValue: string }
>(
  "indicators/resubmitEvidence",
  async ({ id, files, descriptions, notes }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      descriptions.forEach((desc) => formData.append("descriptions", desc));
      if (notes) formData.append("notes", notes);

      const { data } = await api.post(`/indicators/resubmit/${id}`, formData);
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Resubmission failed"));
    }
  },
);

export const adminSubmitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { indicatorId: string; files: File[]; descriptions: string[] },
  { rejectValue: string }
>(
  "indicators/adminSubmitEvidence",
  async (
    { indicatorId, files, descriptions },
    { dispatch, rejectWithValue },
  ) => {
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
  },
);

export const fetchEvidencePreviewUrl = createAsyncThunk<
  { cacheKey: string; previewUrl: string },
  { indicatorId: string; publicId: string; version: number },
  { state: RootState; rejectValue: string }
>(
  "indicators/preview",
  async ({ indicatorId, publicId, version }, { getState, rejectWithValue }) => {
    try {
      // 1. Check Cache
      const cacheKey = `${publicId}@v${version}`;
      const existing = (getState() as RootState).indicators.previewUrls[cacheKey];
      if (existing) return { cacheKey, previewUrl: existing };

      // 2. Fetch with encoded PublicID
      const { data } = await api.get(
        `/indicators/${indicatorId}/preview-evidence`,
        {
          params: { 
            // VERY IMPORTANT: Ensure the path is safely transmitted
            publicId: encodeURIComponent(publicId) 
          },
          withCredentials: true,
        }
      );
      
      return { cacheKey, previewUrl: data.url };
    } catch (err) {
      return rejectWithValue(handleError(err, "Preview failed"));
    }
  }
);


export const selectRejectedEvidence = (state: RootState) => {
  // Combine both arrays to ensure we catch data regardless of which fetch was called
  const source = [...state.indicators.userIndicators, ...state.indicators.allIndicators];
  
  // Create a Map to deduplicate indicators by ID (in case a user is in both lists)
  const uniqueIndicators = Array.from(
    new Map(source.map((item) => [item._id, item])).values()
  );

  return uniqueIndicators.flatMap((indicator) =>
    (indicator.evidence || [])
      .filter((e) => e.isArchived === true) // Strict check for archived flag
      .map((e) => ({
        ...e,
        indicatorId: indicator._id,
        indicatorTitle: indicator.indicatorTitle,
        resubmissionAttempt: e.attempt ?? indicator.rejectionCount,
      }))
  );
};


export const selectAllArchivedEvidence = (state: RootState) => {
  return state.indicators.allIndicators.flatMap((indicator) =>
    (indicator.evidence || [])
      .filter((e) => e.isArchived)
      .map((e) => ({
        ...e,
        indicatorTitle: indicator.indicatorTitle,
        indicatorId: indicator._id,
        // Using updatedAt from the indicator as the rejection timestamp 
        // if the specific file doesn't have a unique timestamp.
        rejectedAt: indicator.updatedAt, 
        rejectionNote: indicator.notes?.[indicator.notes.length - 1]?.text || "No reason provided"
      }))
  );
};



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
    removeSpecificPreviewUrl: (state, action: PayloadAction<string>) => {
      delete state.previewUrls[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllIndicatorsForAdmin.fulfilled, (s, a) => {
        s.allIndicators = a.payload;
      })
      .addCase(fetchUserIndicators.fulfilled, (s, a) => {
        s.userIndicators = a.payload;
      })
      .addCase(fetchSubmittedIndicators.fulfilled, (s, a) => {
        s.submittedIndicators = a.payload;
      })
      .addCase(createIndicator.fulfilled, (s, a) => {
        s.allIndicators.unshift(a.payload);
      })
      .addCase(deleteIndicator.fulfilled, (s, a) => {
        const id = a.payload;
        s.allIndicators = s.allIndicators.filter((i) => i._id !== id);
        s.userIndicators = s.userIndicators.filter((i) => i._id !== id);
        s.submittedIndicators = s.submittedIndicators.filter(
          (i) => i._id !== id,
        );
      })
      // inside indicatorSlice extraReducers...
      .addCase(resubmitIndicatorEvidence.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resubmitIndicatorEvidence.fulfilled, (state, action) => {
  state.loading = false;
  const updated = action.payload;
  state.userIndicators = updateList(state.userIndicators, updated);
  state.allIndicators = updateList(state.allIndicators, updated);
  state.submittedIndicators = updateList(state.submittedIndicators, updated);
})

      .addCase(resubmitIndicatorEvidence.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEvidencePreviewUrl.fulfilled, (s, a) => {
        s.previewUrls[a.payload.cacheKey] = a.payload.previewUrl;
      })
      // MATCHERS
      .addMatcher(
        (a): a is PayloadAction<IIndicator> =>
          a.type.endsWith("/fulfilled") &&
          !a.type.includes("preview") &&
          a.type !== "indicators/delete/fulfilled" &&
          typeof a.payload === "object" &&
          "indicatorTitle" in a.payload,
        (s, a) => {
          s.allIndicators = updateList(s.allIndicators, a.payload);
          s.userIndicators = updateList(s.userIndicators, a.payload);
          s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
        },
      )
      .addMatcher(
        (a) => a.type.endsWith("/pending"),
        (s, a) => {
          s.loading = true;
          s.error = null;
          if (
            a.type.includes("submit") ||
            a.type.includes("adminSubmit") ||
            a.type.includes("resubmit")
          ) {
            s.submittingEvidence = true;
          }
        },
      )
      .addMatcher(
        (a) => a.type.endsWith("/fulfilled") || a.type.endsWith("/rejected"),
        (s, a: any) => {
          s.loading = false;
          s.submittingEvidence = false;
          if (a.type.endsWith("/rejected")) {
            s.error = a.payload || "Unexpected error";
          }
        },
      );
  },
});

export const { clearMessages, clearPreviewUrls, removeSpecificPreviewUrl } =
  indicatorSlice.actions;

export const selectUserIndicators = (s: RootState) =>
  s.indicators.userIndicators;
export const selectAllIndicators = (s: RootState) => s.indicators.allIndicators;
export const selectSubmittedIndicators = (s: RootState) =>
  s.indicators.submittedIndicators;
export const selectIndicatorsLoading = (s: RootState) => s.indicators.loading;
export const selectIndicatorsError = (s: RootState) => s.indicators.error;
export const selectPreviewUrls = (s: RootState) => s.indicators.previewUrls;
export const selectSubmittingEvidence = (state: RootState) =>
  state.indicators.submittingEvidence;

export default indicatorSlice.reducer;
