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
  | "partially_completed"
  | "approved"
  | "completed"
  | "rejected"
  | "overdue";

export type AssignedToType = "individual" | "group";

export interface INote {
  text: string;
  createdBy: { _id: string; name: string } | string | null;
  createdAt: string;
}

export interface IScoreHistory {
  score: number;
  submittedBy: { _id: string; name: string } | string;
  submittedAt: string;
}

export interface IEditHistory {
  updatedBy: { _id: string; name: string } | string;
  updatedAt: string;
  changes: Record<string, { old: any; new: any }>;
}

export interface IEvidence {
  _id: string;
  type: "file";
  fileName: string;
  fileSize: number;
  mimeType: string;
  publicId: string;
  version: number;
  resourceType: "image" | "video" | "raw" | "auto";
  cloudinaryType: "authenticated";
  format: string;
  description?: string;
  status?: "active" | "archived" | "rejected";
  isArchived: boolean;
  resubmissionAttempt: number;
  isResubmission: boolean;
  archivedAt?: string;
  previewUrl: string;
  uploadedBy: string;
  uploadedAt: string;
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
  nextDeadline?: string;
  progress: number;
  status: IndicatorStatus;
  rejectionCount: number;
  result?: "pass" | "fail" | null;
  notes: INote[];
  evidence: IEvidence[];
  editHistory: IEditHistory[];
  scoreHistory: IScoreHistory[];
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
  updates: Partial<IIndicator> & { notes?: string };
}

/* =====================================================
   HELPERS
===================================================== */

const handleError = (err: unknown, fallback: string): string => {
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

const normalizeIndicator = (raw: any): IIndicator => ({
  ...raw,
  evidence: (raw.evidence || []).map((e: any, index: number) => {
    const resolvedId =
      e._id || e.id || e.pk || `evidence-${index}-${Date.now()}`;
    return {
      ...e,
      _id: resolvedId,
      type: "file",
      previewUrl: e.previewUrl ?? "",
      isArchived: !!e.isArchived,
      resubmissionAttempt: Number(e.resubmissionAttempt ?? 0),
      createdAt: e.createdAt || e.uploadedAt || new Date().toISOString(),
      description: e.description || "",
    };
  }),
  editHistory: raw.editHistory || [],
  scoreHistory: raw.scoreHistory || [],
  notes: raw.notes || [],
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

/* --- THUNKS --- */

// FETCHING
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
    return rejectWithValue(handleError(err, "Fetch failed"));
  }
});

// MANAGEMENT
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
      dispatch(addNotification(createNotif("Success", "Record Updated")));
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Update failed"));
    }
  },
);

export const submitIndicatorScore = createAsyncThunk<
  IIndicator,
  { id: string; score: number; note?: string; nextDeadline?: string },
  { rejectValue: string }
>("indicators/submitScore", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.patch(
      `/indicators/${payload.id}/submit-score`,
      payload,
    );
    dispatch(
      addNotification(
        createNotif("Score Updated", `Progress set to ${payload.score}%`),
      ),
    );
    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Score submission failed"));
  }
});

// REVIEW
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

// EVIDENCE
export const submitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { id: string; files: File[]; descriptions: string[] },
  { rejectValue: string }
>(
  "indicators/submitEvidence",
  async ({ id, files, descriptions }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      descriptions.forEach((d) => formData.append("descriptions", d));
      const { data } = await api.post(`/indicators/submit/${id}`, formData);
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Upload failed"));
    }
  },
);

export const resubmitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { id: string; files: File[]; descriptions: string[]; notes?: string },
  { rejectValue: string }
>(
  "indicators/resubmitEvidence",
  async ({ id, files, descriptions, notes }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      descriptions.forEach((d) => formData.append("descriptions", d));
      if (notes) formData.append("notes", notes);
      const { data } = await api.post(`/indicators/resubmit/${id}`, formData);
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Resubmission failed"));
    }
  },
);

// DELETE SINGLE EVIDENCE (USER-ONLY)
export const deleteIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { indicatorId: string; evidenceId: string },
  { rejectValue: string }
>(
  "indicators/deleteEvidence",
  async ({ indicatorId, evidenceId }, { dispatch, rejectWithValue }) => {
    try {
      // Validates that IDs exist before firing the request
      if (!indicatorId || !evidenceId) {
        return rejectWithValue("Traceability Error: Missing ID for deletion.");
      }

      // Hits the route: DELETE /indicators/:id/evidence/:evidenceId
      // The backend 'id' param maps to 'indicatorId' here
      const { data } = await api.delete(
        `/indicators/${indicatorId}/evidence/${evidenceId}`
      );

      // Trigger a success notification for the user
      dispatch(
        addNotification(
          createNotif("Removed", "Your evidence has been deleted.")
        )
      );

      // Return normalized indicator to update the state via the fulfilled matcher
      return normalizeIndicator(data.indicator);
    } catch (err) {
      // handleError catches 403 (Not Owner) or 404 (Not Found) from the controller
      return rejectWithValue(handleError(err, "Delete failed"));
    }
  }
);

// DELETE INDICATOR
export const deleteIndicator = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("indicators/delete", async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/indicators/delete/${id}`);
    dispatch(addNotification(createNotif("Deleted", "Indicator removed.")));
    return id;
  } catch (err) {
    return rejectWithValue(handleError(err, "Deletion failed"));
  }
});

// PREVIEW
export const fetchEvidencePreviewUrl = createAsyncThunk<
  { cacheKey: string; previewUrl: string },
  { indicatorId: string; publicId: string; version: number },
  { state: RootState; rejectValue: string }
>(
  "indicators/preview",
  async ({ indicatorId, publicId, version }, { getState, rejectWithValue }) => {
    try {
      const cacheKey = `${publicId}@v${version}`;
      const existing = (getState() as RootState).indicators.previewUrls[
        cacheKey
      ];
      if (existing) return { cacheKey, previewUrl: existing };

      const { data } = await api.get(
        `/indicators/${indicatorId}/preview-evidence`,
        {
          params: { publicId: encodeURIComponent(publicId) },
          withCredentials: true,
        },
      );
      return { cacheKey, previewUrl: data.url };
    } catch (err) {
      return rejectWithValue(handleError(err, "Preview failed"));
    }
  },
);

// UPDATE EVIDENCE NOTE
// UPDATE EVIDENCE NOTE THUNK
export const updateEvidenceNote = createAsyncThunk<
  IIndicator,
  { indicatorId: string; evidenceId: string; description: string },
  { rejectValue: string }
>(
  "indicators/updateEvidenceNote",
  async ({ indicatorId, evidenceId, description }, { rejectWithValue }) => {
    try {
      if (!indicatorId || !evidenceId || evidenceId === "undefined") {
        return rejectWithValue("Traceability Error: ID mapping failed.");
      }

      // Hits PATCH /indicators/:id/evidence/:evidenceId/description
      const { data } = await api.patch(
        `/indicators/${indicatorId}/evidence/${evidenceId}/description`,
        { description }
      );

      // Backend returns { success, message, indicator }
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Failed to update exhibit note"));
    }
  }
);

// ADMIN EVIDENCE
export const adminSubmitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { id: string; files: File[]; descriptions: string[] },
  { rejectValue: string }
>(
  "indicators/adminSubmitEvidence",
  async ({ id, files, descriptions }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      descriptions.forEach((d) => formData.append("descriptions", d));

      const { data } = await api.post(
        `/indicators/admin/submit/${id}`,
        formData,
      );
      dispatch(
        addNotification(createNotif("Success", "Admin Evidence Uploaded")),
      );
      return normalizeIndicator(data.indicator);
    } catch (err) {
      return rejectWithValue(handleError(err, "Admin upload failed"));
    }
  },
);

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
export const selectPreviewUrls = (s: RootState) => s.indicators.previewUrls;
export const selectSubmittingEvidence = (s: RootState) =>
  s.indicators.submittingEvidence;

export const selectRejectedEvidence = (state: RootState) => {
  const source = [
    ...state.indicators.userIndicators,
    ...state.indicators.allIndicators,
  ];
  const unique = Array.from(new Map(source.map((i) => [i._id, i])).values());
  return unique.flatMap((indicator) =>
    (indicator.evidence || [])
      .filter((e) => e.isArchived || e.status === "rejected")
      .map((e) => ({
        ...e,
        indicatorId: indicator._id,
        indicatorTitle: indicator.indicatorTitle,
        resubmissionAttempt: e.resubmissionAttempt ?? indicator.rejectionCount,
      })),
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
  },
  extraReducers: (builder) => {
    builder
      // Standard Fulfilled
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
        s.allIndicators = [a.payload, ...s.allIndicators];
      })
      .addCase(deleteIndicator.fulfilled, (s, a) => {
        const id = a.payload;
        s.allIndicators = s.allIndicators.filter((i) => i._id !== id);
        s.userIndicators = s.userIndicators.filter((i) => i._id !== id);
        s.submittedIndicators = s.submittedIndicators.filter(
          (i) => i._id !== id,
        );
        // Remove any cached previews
        Object.keys(s.previewUrls).forEach((k) => {
          if (k.includes(id)) delete s.previewUrls[k];
        });
      })
      .addCase(fetchEvidencePreviewUrl.fulfilled, (s, a) => {
        s.previewUrls[a.payload.cacheKey] = a.payload.previewUrl;
      })

      // Global Matcher: Indicator Updates
      .addMatcher(
        (a): a is PayloadAction<IIndicator> =>
          a.type.endsWith("/fulfilled") &&
          [
            "update",
            "approve",
            "reject",
            "submitScore",
            "submitEvidence",
            "resubmitEvidence",
            "adminSubmitEvidence",
            "deleteEvidence",
            "updateEvidenceNote",
          ].some((t) => a.type.includes(t)),
        (s, a) => {
          const updated = a.payload;
          const mapFn = (i: IIndicator) =>
            i._id === updated._id ? updated : i;
          s.allIndicators = s.allIndicators.map(mapFn);
          s.userIndicators = s.userIndicators.map(mapFn);
          s.submittedIndicators = s.submittedIndicators.map(mapFn);

          // Clear preview URLs if evidence changed
          if (
            [
              "submitEvidence",
              "resubmitEvidence",
              "adminSubmitEvidence",
              "deleteEvidence",
            ].some((t) => a.type.includes(t))
          ) {
            Object.keys(s.previewUrls).forEach((k) => {
              if (updated.evidence.find((e) => k.startsWith(e._id))) {
                delete s.previewUrls[k];
              }
            });
          }
        },
      )

      // Pending Matcher
      .addMatcher(
        (a) => a.type.endsWith("/pending"),
        (s, a) => {
          if (
            ["submitEvidence", "resubmitEvidence", "adminSubmitEvidence"].some(
              (t) => a.type.includes(t),
            )
          ) {
            s.submittingEvidence = true;
          } else {
            s.loading = true;
          }
          s.error = null;
        },
      )

      // Error / Fulfilled Cleanup Matcher
      .addMatcher(
        (a) => a.type.endsWith("/fulfilled") || a.type.endsWith("/rejected"),
        (s, a: any) => {
          s.loading = false;
          s.submittingEvidence = false;
          if (a.type.endsWith("/rejected")) {
            s.error = a.payload || a.error?.message || "Unexpected error";
          }
        },
      );
  },
});

export const { clearMessages, clearPreviewUrls } = indicatorSlice.actions;
export default indicatorSlice.reducer;
