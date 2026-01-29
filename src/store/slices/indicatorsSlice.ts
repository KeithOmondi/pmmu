// src/store/slices/indicatorsSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import api from "../../api/axios";
import { addNotification } from "./notificationsSlice";
import type { AxiosError } from "axios";

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

/* =====================================================
   PAYLOAD TYPES
===================================================== */

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
  _id: raw._id,
  indicatorTitle: raw.indicatorTitle ?? "",
  category: raw.category ?? null,
  level2Category: raw.level2Category ?? null,
  unitOfMeasure: raw.unitOfMeasure ?? "",
  assignedToType: raw.assignedToType ?? "individual",
  assignedTo: raw.assignedTo?._id ?? raw.assignedTo ?? null,
  assignedGroup: Array.isArray(raw.assignedGroup)
    ? raw.assignedGroup.map((g: any) => g._id ?? g)
    : [],
  startDate: raw.startDate ?? "",
  dueDate: raw.dueDate ?? "",
  progress: raw.progress ?? 0,
  status: raw.status ?? "pending",
  rejectionCount: raw.rejectionCount ?? 0,
  result: raw.result ?? null,
  notes: Array.isArray(raw.notes)
    ? raw.notes.map((n: any) => ({
        text: n.text ?? "",
        createdBy: n.createdBy?._id ?? n.createdBy ?? null,
        createdAt: n.createdAt ?? new Date().toISOString(),
      }))
    : [],
  evidence: Array.isArray(raw.evidence)
    ? raw.evidence.map((e: any) => ({
        type: "file",
        fileName: e.fileName ?? "",
        fileSize: e.fileSize ?? 0,
        mimeType: e.mimeType ?? "application/octet-stream",
        publicId: e.publicId,
        resourceType: e.resourceType,
        cloudinaryType: e.cloudinaryType,
        format: e.format,
        previewUrl: e.previewUrl,
        description: e.description,
      }))
    : [],
  createdBy: raw.createdBy?._id ?? raw.createdBy ?? null,
  reviewedBy: raw.reviewedBy?._id ?? raw.reviewedBy ?? null,
  reviewedAt: raw.reviewedAt ?? null,
  calendarEvent: raw.calendarEvent ?? null,
  createdAt: raw.createdAt ?? "",
  updatedAt: raw.updatedAt ?? "",
});

const normalizeCreatePayload = (p: CreateIndicatorPayload) => ({
  ...p,
  assignedTo: p.assignedTo || null,
  assignedGroup: Array.isArray(p.assignedGroup) ? p.assignedGroup : [],
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

/* =====================================================
   THUNKS
===================================================== */

export const createIndicator = createAsyncThunk<
  IIndicator,
  CreateIndicatorPayload,
  { rejectValue: string }
>("indicators/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post(
      "/indicators/create",
      normalizeCreatePayload(payload),
    );
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Creation failed"));
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

export const submitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  SubmitEvidencePayload,
  { rejectValue: string }
>(
  "indicators/submit",
  async ({ id, files, descriptions = [] }, { dispatch, rejectWithValue }) => {
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      descriptions.forEach((d) => form.append("descriptions", d));

      const { data } = await api.post(`/indicators/submit/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const indicator = normalizeIndicator(data.indicator);

      dispatch(
        addNotification({
          _id: `notif-${Date.now()}`,
          title: "Evidence Uploaded",
          message: indicator.indicatorTitle,
          read: false,
          createdAt: new Date().toISOString(),
        }),
      );

      return indicator;
    } catch (err) {
      return rejectWithValue(handleError(err, "Submission failed"));
    }
  },
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
  { id: string; notes: string },
  { rejectValue: string }
>("indicators/reject", async ({ id, notes }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/reject/${id}`, { notes });
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Rejection failed"));
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

export const updateIndicator = createAsyncThunk<
  IIndicator,
  UpdateIndicatorPayload,
  { rejectValue: string }
>("indicators/update", async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/update/${id}`, updates);
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Update failed"));
  }
});

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
      .addCase(fetchUserIndicators.fulfilled, (s, a) => {
        s.userIndicators = a.payload;
      })
      .addCase(fetchAllIndicatorsForAdmin.fulfilled, (s, a) => {
        s.allIndicators = a.payload;
      })
      .addCase(fetchSubmittedIndicators.fulfilled, (s, a) => {
        s.submittedIndicators = a.payload;
      })
      .addCase(createIndicator.fulfilled, (s, a) => {
        s.allIndicators.unshift(a.payload);
      })
      .addCase(updateIndicator.fulfilled, (s, a) => {
        s.allIndicators = updateList(s.allIndicators, a.payload);
        s.userIndicators = updateList(s.userIndicators, a.payload);
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
      })
      .addCase(submitIndicatorEvidence.pending, (s) => {
        s.submittingEvidence = true;
      })
      .addCase(submitIndicatorEvidence.fulfilled, (s, a) => {
        s.submittingEvidence = false;
        s.userIndicators = updateList(s.userIndicators, a.payload);
        s.allIndicators = updateList(s.allIndicators, a.payload);
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
      })
      .addCase(submitIndicatorEvidence.rejected, (s, a) => {
        s.submittingEvidence = false;
        s.error = a.payload ?? "Submission failed";
      })
      .addMatcher(
        (a) => a.type.endsWith("/pending"),
        (s) => {
          s.loading = true;
          s.error = null;
        },
      )
      .addMatcher(
        (a) => a.type.endsWith("/fulfilled"),
        (s) => {
          s.loading = false;
        },
      )
      .addMatcher(
        (a) => a.type.endsWith("/rejected"),
        (s, a: any) => {
          s.loading = false;
          s.error = a.payload ?? "Unexpected error";
        },
      );
  },
});

/* =====================================================
   EXPORTS
===================================================== */

export const { clearMessages } = indicatorSlice.actions;

export const selectUserIndicators = (s: RootState) =>
  s.indicators.userIndicators;
export const selectAllIndicators = (s: RootState) => s.indicators.allIndicators;
export const selectSubmittedIndicators = (s: RootState) =>
  s.indicators.submittedIndicators;
export const selectIndicatorsLoading = (s: RootState) => s.indicators.loading;
export const selectSubmittingEvidence = (s: RootState) =>
  s.indicators.submittingEvidence;
export const selectIndicatorsError = (s: RootState) => s.indicators.error;

export default indicatorSlice.reducer;
