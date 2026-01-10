// src/store/slices/indicatorsSlice.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";
import api from "../../api/axios";
import { addNotification } from "./notificationsSlice";
import type { AxiosError } from "axios";

/* =====================================
   TYPES & INTERFACES
===================================== */
export type IndicatorStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "completed"
  | "rejected"
  | "overdue";

export type AssignedToType = "individual" | "group";

export interface IEvidence {
  type: "file";
  fileUrl: string;
  fileName: string;
  publicId: string;
  fileType: string;
  fileSize: number;
  description?: string;
  createdAt?: string; // Ensure createdAt is always tracked
}

export interface ICategoryRef {
  _id: string;
  title: string;
  code?: string;
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
  notes: unknown[];
  evidence: IEvidence[];
  status: IndicatorStatus;
  result?: "pass" | "fail" | null;
  createdBy: any;
  reviewedBy: any;
  reviewedAt: string | null;
  calendarEvent?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/* =====================================
   PAYLOADS
===================================== */
export interface CreateIndicatorPayload {
  categoryId: string;
  level2CategoryId: string;
  indicatorId: string;
  unitOfMeasure: string;
  assignedToType: AssignedToType;
  assignedTo?: string;
  assignedGroup?: string[];
  startDate: string;
  dueDate: string;
  calendarEvent?: Record<string, unknown>;
}

export interface UpdateIndicatorPayload {
  id: string;
  updates: Partial<
    Omit<IIndicator, "_id" | "indicatorTitle" | "createdBy" | "createdAt">
  >;
}

export interface SubmitEvidencePayload {
  id: string;
  files: File[];
  descriptions?: string[];
}

export interface DownloadEvidencePayload {
  publicId: string;
  fileName: string;
}

/* =====================================
   HELPERS
===================================== */
const normalizeIndicator = (i: any): IIndicator => ({
  _id: i._id,
  indicatorTitle: i.indicatorTitle ?? "",
  category: i.category ?? null,
  level2Category: i.level2Category ?? null,
  unitOfMeasure: i.unitOfMeasure ?? "",
  assignedToType: i.assignedToType ?? "individual",
  assignedTo: i.assignedTo ?? null,
  assignedGroup: Array.isArray(i.assignedGroup) ? i.assignedGroup : [],
  startDate: i.startDate ?? "",
  dueDate: i.dueDate ?? "",
  progress: i.progress ?? 0,
  notes: Array.isArray(i.notes) ? i.notes : [],
  evidence: Array.isArray(i.evidence)
    ? i.evidence.map((e: any) => ({
        ...e,
        createdAt: e.createdAt ?? new Date().toISOString(), // Ensure createdAt exists
      }))
    : [],
  status: i.status ?? "pending",
  result: i.result ?? null,
  createdBy: i.createdBy ?? null,
  reviewedBy: i.reviewedBy ?? null,
  reviewedAt: i.reviewedAt ?? null,
  calendarEvent: i.calendarEvent ?? null,
  createdAt: i.createdAt ?? "",
  updatedAt: i.updatedAt ?? "",
});

const handleError = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "isAxiosError" in err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    return axiosErr.response?.data?.message ?? fallback;
  }
  return (err as Error)?.message ?? fallback;
};

/* =====================================
   ASYNC THUNKS
===================================== */
export const createIndicator = createAsyncThunk<
  IIndicator,
  CreateIndicatorPayload,
  { rejectValue: string }
>("indicators/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/indicators/create", payload);
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Indicator creation failed"));
  }
});

export const updateIndicator = createAsyncThunk<
  IIndicator,
  UpdateIndicatorPayload,
  { rejectValue: string }
>("indicators/update", async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/update/${id}`, updates);
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Indicator update failed"));
  }
});

export const fetchUserIndicators = createAsyncThunk<
  IIndicator[],
  void,
  { rejectValue: string }
>("indicators/fetchUser", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/indicators/my");
    return data.indicators.map(normalizeIndicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Failed to fetch indicators"));
  }
});

export const fetchAllIndicatorsForAdmin = createAsyncThunk<
  IIndicator[],
  void,
  { rejectValue: string }
>("indicators/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/indicators/all");
    return data.indicators.map(normalizeIndicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Failed to fetch all indicators"));
  }
});

export const fetchSubmittedIndicators = createAsyncThunk<
  IIndicator[],
  void,
  { rejectValue: string }
>("indicators/fetchSubmitted", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/indicators/submitted");
    return data.indicators.map(normalizeIndicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Failed to fetch submissions"));
  }
});

export const deleteIndicator = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("indicators/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/indicators/delete/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(handleError(err, "Delete failed"));
  }
});

/* =====================================
   SUBMIT EVIDENCE
===================================== */
export const submitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  SubmitEvidencePayload,
  { rejectValue: string }
>(
  "indicators/submitEvidence",
  async ({ id, files, descriptions }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      descriptions?.forEach((desc) => formData.append("descriptions", desc));

      const { data } = await api.post(`/indicators/submit/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const indicator = normalizeIndicator(data.indicator);

      dispatch(
        addNotification({
          _id: `notif-${Date.now()}`,
          title: "Submission Successful",
          message: `Evidence for "${indicator.indicatorTitle}" uploaded.`,
          read: false,
          createdAt: new Date().toISOString(),
        })
      );

      return indicator;
    } catch (err) {
      return rejectWithValue(handleError(err, "Evidence submission failed"));
    }
  }
);

/* =====================================
   DOWNLOAD / APPROVE / REJECT
===================================== */
export const downloadEvidence = createAsyncThunk<
  void,
  DownloadEvidencePayload,
  { rejectValue: string }
>(
  "indicators/downloadEvidence",
  async ({ publicId, fileName }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/indicators/evidence/${publicId}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      return rejectWithValue("Failed to download evidence");
    }
  }
);

export const approveIndicator = createAsyncThunk<
  IIndicator,
  string,
  { rejectValue: string }
>("indicators/approve", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/approve/${id}`);
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Approval failed"));
  }
});

export const rejectIndicator = createAsyncThunk<
  IIndicator,
  string,
  { rejectValue: string }
>("indicators/reject", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/reject/${id}`);
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Rejection failed"));
  }
});

/* =====================================
   SLICE
===================================== */
interface IndicatorState {
  userIndicators: IIndicator[];
  allIndicators: IIndicator[];
  submittedIndicators: IIndicator[];
  loading: boolean;
  submittingEvidence: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: IndicatorState = {
  userIndicators: [],
  allIndicators: [],
  submittedIndicators: [],
  loading: false,
  submittingEvidence: false,
  error: null,
  successMessage: null,
};

const updateList = (list: IIndicator[], updated: IIndicator) =>
  list.map((i) => (i._id === updated._id ? updated : i));

const indicatorSlice = createSlice({
  name: "indicators",
  initialState,
  reducers: {
    clearMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ----------------- Evidence Submission ----------------- */
      .addCase(submitIndicatorEvidence.pending, (s) => {
        s.submittingEvidence = true;
        s.error = null;
      })
      .addCase(submitIndicatorEvidence.fulfilled, (s, a) => {
        s.submittingEvidence = false;
        s.userIndicators = updateList(s.userIndicators, a.payload);
        s.allIndicators = updateList(s.allIndicators, a.payload);
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
      })
      .addCase(
        submitIndicatorEvidence.rejected,
        (s, a: PayloadAction<string | undefined>) => {
          s.submittingEvidence = false;
          s.error = a.payload ?? "Failed to submit evidence";
        }
      )

      /* ----------------- Other Fulfilled Actions ----------------- */
      .addCase(updateIndicator.fulfilled, (s, a) => {
        s.userIndicators = updateList(s.userIndicators, a.payload);
        s.allIndicators = updateList(s.allIndicators, a.payload);
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
      })
      .addCase(approveIndicator.fulfilled, (s, a) => {
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
      })
      .addCase(rejectIndicator.fulfilled, (s, a) => {
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
      })
      .addCase(fetchUserIndicators.fulfilled, (s, a) => {
        s.userIndicators = a.payload;
      })
      .addCase(fetchAllIndicatorsForAdmin.fulfilled, (s, a) => {
        s.allIndicators = a.payload;
      })
      .addCase(fetchSubmittedIndicators.fulfilled, (s, a) => {
        s.submittedIndicators = a.payload;
      })
      .addCase(deleteIndicator.fulfilled, (s, a) => {
        s.userIndicators = s.userIndicators.filter((i) => i._id !== a.payload);
        s.allIndicators = s.allIndicators.filter((i) => i._id !== a.payload);
        s.submittedIndicators = s.submittedIndicators.filter(
          (i) => i._id !== a.payload
        );
      })

      /* ----------------- Generic Loading/Error ----------------- */
      .addMatcher(
        (a) => a.type.startsWith("indicators/") && a.type.endsWith("/pending"),
        (s) => {
          s.loading = true;
          s.error = null;
        }
      )
      .addMatcher(
        (a) =>
          a.type.startsWith("indicators/") && a.type.endsWith("/fulfilled"),
        (s) => {
          s.loading = false;
        }
      )
      .addMatcher(
        (a) => a.type.startsWith("indicators/") && a.type.endsWith("/rejected"),
        (s, a: PayloadAction<string | undefined>) => {
          s.loading = false;
          s.error = a.payload ?? "Unexpected error";
        }
      );
  },
});

/* =====================================
   SELECTORS & EXPORTS
===================================== */
export const selectUserIndicators = (s: RootState) =>
  s.indicators.userIndicators;
export const selectAllIndicators = (s: RootState) => s.indicators.allIndicators;
export const selectSubmittedIndicators = (s: RootState) =>
  s.indicators.submittedIndicators;
export const selectIndicatorsLoading = (s: RootState) => s.indicators.loading;
export const selectSubmittingEvidence = (s: RootState) =>
  s.indicators.submittingEvidence;
export const selectIndicatorsError = (s: RootState) => s.indicators.error;

export const { clearMessages } = indicatorSlice.actions;
export default indicatorSlice.reducer;
