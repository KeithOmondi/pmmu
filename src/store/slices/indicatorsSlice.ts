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
  type: "file";
  fileName: string;
  fileSize: number;
  mimeType: string;
  publicId: string;
  resourceType: "raw" | "image" | "video";
  cloudinaryType: "authenticated";
  format: string;
  previewUrl: string;
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
  evidence: (raw.evidence || []).map((e: any) => ({ ...e, type: "file" })),
});

const handleError = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "isAxiosError" in err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    return axiosErr.response?.data?.message ?? fallback;
  }
  return (err as Error)?.message ?? fallback;
};

const updateList = (list: IIndicator[], updated: IIndicator) =>
  list.map((i) => (i._id === updated._id ? updated : i));

const createNotif = (title: string, message: string) => ({
  _id: `notif-${Date.now()}`,
  title,
  message,
  read: false,
  createdAt: new Date().toISOString(),
});

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
    const indicator = normalizeIndicator(data.indicator);
    dispatch(
      addNotification(
        createNotif("Success", "Indicator created successfully."),
      ),
    );
    return indicator;
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
      const indicator = normalizeIndicator(data.indicator);
      dispatch(
        addNotification(
          createNotif("Success", "Registry record updated successfully."),
        ),
      );
      return indicator;
    } catch (err: any) {
      return rejectWithValue(handleError(err, "Update failed"));
    }
  },
);

export const approveIndicator = createAsyncThunk<
  IIndicator,
  { id: string; notes?: string }, // Change from string to object
  { rejectValue: string }
>("indicators/approve", async ({ id, notes }, { dispatch, rejectWithValue }) => {
  try {
    // We pass { notes } as the second argument to create the request body
    const { data } = await api.put(`/indicators/approve/${id}`, { notes });
    
    const indicator = normalizeIndicator(data.indicator);
    const isFinal = indicator.status === "completed";
    
    dispatch(
      addNotification(
        createNotif(
          isFinal ? "Finalized" : "Verified",
          isFinal
            ? "Record archived as completed."
            : "Record verified; pending ratification.",
        ),
      ),
    );
    
    return indicator;
  } catch (err) {
    return rejectWithValue(handleError(err, "Approval failed"));
  }
});

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
    dispatch(
      addNotification(
        createNotif("Purged", "Indicator removed from registry."),
      ),
    );
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

      // 1. Append Text Fields (descriptions)
      // These will land in req.body.descriptions on the backend
      descriptions.forEach((d) => {
        form.append("descriptions", d);
      });

      // 2. Append Binary Files
      // These will land in req.files on the backend
      files.forEach((f) => {
        form.append("files", f);
      });

      // 3. API Call with Header Override
      // We set Content-Type to undefined to override the global application/json default.
      // This allows the browser to correctly set 'multipart/form-data' PLUS the 
      // essential 'boundary' string required by Multer.
      const { data } = await api.post(`/indicators/submit/${id}`, form, {
        headers: {
          "Content-Type": undefined,
        },
      });

      // Trigger local notification
      dispatch(
        addNotification(
          createNotif("Evidence Logged", "Files uploaded successfully.")
        )
      );

      // Return the normalized indicator to update the Redux state
      return normalizeIndicator(data.indicator);
    } catch (err: any) {
      const message = err.response?.data?.message || "Submission failed";
      return rejectWithValue(message);
    }
  }
);

/* =====================================================
    SLICE
===================================================== */
interface IndicatorState {
  userIndicators: IIndicator[];
  allIndicators: IIndicator[];
  submittedIndicators: IIndicator[];
  loading: boolean;
  submittingEvidence: boolean;
  error: string | null;
}

const initialState: IndicatorState = {
  userIndicators: [],
  allIndicators: [],
  submittedIndicators: [],
  loading: false,
  submittingEvidence: false,
  error: null,
};

const indicatorSlice = createSlice({
  name: "indicators",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* FETCH HANDLERS */
      .addCase(fetchAllIndicatorsForAdmin.fulfilled, (state, action) => {
        state.allIndicators = action.payload;
      })
      .addCase(fetchUserIndicators.fulfilled, (state, action) => {
        state.userIndicators = action.payload;
      })
      .addCase(fetchSubmittedIndicators.fulfilled, (state, action) => {
        state.submittedIndicators = action.payload;
      })

      /* CREATE HANDLER */
      .addCase(createIndicator.fulfilled, (state, action) => {
        state.allIndicators = [action.payload, ...state.allIndicators];
      })

      /* DELETE HANDLER */
      .addCase(deleteIndicator.fulfilled, (state, action) => {
        const id = action.payload;
        state.allIndicators = state.allIndicators.filter((i) => i._id !== id);
        state.userIndicators = state.userIndicators.filter((i) => i._id !== id);
        state.submittedIndicators = state.submittedIndicators.filter(
          (i) => i._id !== id,
        );
      })

      /* EVIDENCE LOADING STATE */
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

      /* UNIFIED UPDATER (MATCHERS) */
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

      /* GLOBAL PENDING */
      .addMatcher(
        (action) =>
          action.type.endsWith("/pending") && !action.type.includes("submit"),
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )

      /* GLOBAL FINISHED */
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

export const { clearMessages } = indicatorSlice.actions;

/* SELECTORS */
export const selectUserIndicators = (s: RootState) =>
  s.indicators.userIndicators;
export const selectAllIndicators = (s: RootState) => s.indicators.allIndicators;
export const selectSubmittedIndicators = (s: RootState) =>
  s.indicators.submittedIndicators;
export const selectIndicatorsLoading = (s: RootState) => s.indicators.loading;
export const selectIndicatorsError = (s: RootState) => s.indicators.error;
export const selectSubmittingEvidence = (s: RootState) =>
  s.indicators.submittingEvidence;

export default indicatorSlice.reducer;
