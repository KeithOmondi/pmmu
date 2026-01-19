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

export interface INote {
  text: string;
  createdBy: string | null;
  createdAt: string;
}

export interface IEvidence {
  type: "file";
  fileName: string;
  fileSize: number;
  publicId: string;
  mimeType: string;
  secureUrl?: string;
  resourceType?: "image" | "raw" | "video";
  cloudinaryType?: "authenticated" | "upload";
  format?: string;
  description?: string;
  createdAt?: string;
  zipParent?: string;
  reviewed?: boolean;
}

export interface ICategoryRef {
  _id: string;
  title: string;
  code?: string;
}

export interface UpdateProgressPayload {
  id: string;
  progress: number;
}

export interface RejectIndicatorPayload {
  id: string;
  notes: string;
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
  notes: INote[];
  evidence: IEvidence[];
  status: IndicatorStatus;
  result?: "pass" | "fail" | null;
  createdBy: string | null;
  reviewedBy: string | null;
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
  zipParent?: string;
}

export interface DownloadEvidencePayload {
  indicatorId: string;
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
  assignedTo: i.assignedTo?._id ?? i.assignedTo ?? null,
  assignedGroup: Array.isArray(i.assignedGroup)
    ? i.assignedGroup.map((g: any) => g._id ?? g)
    : [],
  startDate: i.startDate ?? "",
  dueDate: i.dueDate ?? "",
  progress: i.progress ?? 0,
  notes: Array.isArray(i.notes)
    ? i.notes.map((n: any) => ({
        text: n.text ?? "",
        createdBy: n.createdBy?._id ?? n.createdBy ?? null,
        createdAt: n.createdAt ?? new Date().toISOString(),
      }))
    : [],
  evidence: Array.isArray(i.evidence)
    ? i.evidence.map((e: any) => ({
        type: e.type,
        fileName: e.fileName,
        fileSize: e.fileSize,
        publicId: e.publicId,
        mimeType: e.mimeType,
        secureUrl: e.secureUrl,
        resourceType: e.resourceType,
        cloudinaryType: e.cloudinaryType,
        format: e.format,
        description: e.description,
        zipParent: e.zipParent,
        reviewed: e.reviewed ?? false,
        createdAt: e.createdAt ?? new Date().toISOString(),
      }))
    : [],
  status: i.status ?? "pending",
  result: i.result ?? null,
  createdBy: i.createdBy?._id ?? i.createdBy ?? null,
  reviewedBy: i.reviewedBy?._id ?? i.reviewedBy ?? null,
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

const updateList = (list: IIndicator[], updated: IIndicator) =>
  list.map((i) => (i._id === updated._id ? updated : i));

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

export const submitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  SubmitEvidencePayload,
  { rejectValue: string }
>(
  "indicators/submitEvidence",
  async (
    { id, files, descriptions = [], zipParent },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      files.forEach((file, idx) => {
        formData.append("files", file);
        if (descriptions[idx])
          formData.append("descriptions", descriptions[idx]);
        if (zipParent) formData.append("zipParent", zipParent);
      });

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

export const downloadEvidence = createAsyncThunk<
  { success: true },
  DownloadEvidencePayload,
  { rejectValue: string }
>(
  "indicators/downloadEvidence",
  async ({ indicatorId, publicId, fileName }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/indicators/${indicatorId}/evidence/${encodeURIComponent(
          publicId
        )}/download`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          return rejectWithValue(json.message || "Download failed");
        } catch {
          return rejectWithValue("Download failed");
        }
      }
      return rejectWithValue(handleError(err, "Secure download failed"));
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

// Reject Indicator
export const rejectIndicator = createAsyncThunk<
  IIndicator,
  { id: string; notes: string },
  { rejectValue: string }
>(
  "indicators/reject",
  async ({ id, notes }, { rejectWithValue }) => {
    if (!notes.trim()) return rejectWithValue("Rejection requires a remark");

    try {
      // ⚡ Update URL to match backend
      const { data } = await api.put(`/indicators/reject/${id}`, {
        notes: notes.trim(),
        status: "rejected",
      });
      return normalizeIndicator(data.indicator);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? "Rejection failed");
    }
  }
);





export const updateIndicatorProgress = createAsyncThunk<
  IIndicator,
  UpdateProgressPayload,
  { rejectValue: string }
>(
  "indicators/updateProgress",
  async ({ id, progress }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/indicators/${id}/progress`, {
        progress,
      });
      return normalizeIndicator(data.indicator || data.data);
    } catch (err) {
      return rejectWithValue(handleError(err, "Failed to update progress"));
    }
  }
);

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
      /* ---------------- Evidence Submission ---------------- */
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

      /* ---------------- Create / Update / Delete ---------------- */
      .addCase(createIndicator.fulfilled, (s, a) => {
        s.userIndicators.push(a.payload);
      })
      .addCase(updateIndicator.fulfilled, (s, a) => {
        s.userIndicators = updateList(s.userIndicators, a.payload);
        s.allIndicators = updateList(s.allIndicators, a.payload);
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
      })
      .addCase(deleteIndicator.fulfilled, (s, a) => {
        s.userIndicators = s.userIndicators.filter((i) => i._id !== a.payload);
        s.allIndicators = s.allIndicators.filter((i) => i._id !== a.payload);
        s.submittedIndicators = s.submittedIndicators.filter(
          (i) => i._id !== a.payload
        );
      })

      /* ---------------- Approval / Rejection ---------------- */
      .addCase(approveIndicator.fulfilled, (s, a) => {
        s.userIndicators = updateList(s.userIndicators, a.payload);
        s.allIndicators = updateList(s.allIndicators, a.payload);
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
        s.successMessage = `"${a.payload.indicatorTitle}" approved successfully`;
      })
      .addCase(rejectIndicator.fulfilled, (state, action) => {
  state.userIndicators = updateList(state.userIndicators, action.payload);
  state.allIndicators = updateList(state.allIndicators, action.payload);
  state.submittedIndicators = updateList(state.submittedIndicators, action.payload);
  state.successMessage = `"${action.payload.indicatorTitle}" rejected successfully`;
})
.addCase(rejectIndicator.rejected, (state, action) => {
  state.error = action.payload ?? "Rejection failed";
})


      /* ---------------- Fetching ---------------- */
      .addCase(fetchUserIndicators.fulfilled, (s, a) => {
        s.userIndicators = a.payload;
      })
      .addCase(fetchAllIndicatorsForAdmin.fulfilled, (s, a) => {
        s.allIndicators = a.payload;
      })
      .addCase(fetchSubmittedIndicators.fulfilled, (s, a) => {
        s.submittedIndicators = a.payload;
      })

      /* ---------------- Progress Update ---------------- */
      .addCase(updateIndicatorProgress.fulfilled, (s, a) => {
        s.userIndicators = updateList(s.userIndicators, a.payload);
        s.allIndicators = updateList(s.allIndicators, a.payload);
        s.submittedIndicators = updateList(s.submittedIndicators, a.payload);
        s.successMessage = "Progress updated successfully";
      })

      /* ---------------- Generic Loading/Error ---------------- */
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
