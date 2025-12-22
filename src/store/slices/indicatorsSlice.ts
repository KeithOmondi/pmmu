import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";
import api from "../../api/axios";
import { addNotification } from "./notificationsSlice";

export type IndicatorStatus = "pending" | "approved" | "rejected" | "overdue";
export type AssignedToType = "individual" | "group";

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
  evidence: any[];
  status: IndicatorStatus;
  createdBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  calendarEvent?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  
}

// --- DTOs (Payloads) ---
export interface CreateIndicatorPayload {
  categoryId: string;
  level2CategoryId: string;
  indicatorId?: string; // optional now
  unitOfMeasure: string;
  assignedToType: AssignedToType;
  assignedTo?: string;
  assignedGroup?: string[];
  startDate: string;
  dueDate: string;
  notes?: unknown[];
  calendarEvent?: Record<string, unknown>;
}

export interface UpdateIndicatorPayload {
  id: string;
  updates: Partial<CreateIndicatorPayload>;
}

export interface SubmitEvidencePayload {
  id: string;
  files: File[];
  descriptions?: string[];
}

// --- Helpers ---
const normalizeIndicator = (i: any): IIndicator => ({
  _id: i._id,
  indicatorTitle: i.indicatorTitle ?? "",
  category: i.category ?? null,
  level2Category: i.level2Category ?? null,
  unitOfMeasure: i.unitOfMeasure ?? "",
  assignedToType: i.assignedToType,
  assignedTo: i.assignedTo ?? null,
  assignedGroup: Array.isArray(i.assignedGroup) ? i.assignedGroup : [],
  startDate: i.startDate,
  dueDate: i.dueDate,
  progress: i.progress ?? 0,
  notes: Array.isArray(i.notes) ? i.notes : [],
  evidence: Array.isArray(i.evidence) ? i.evidence : [],
  status: i.status ?? "pending",
  createdBy: i.createdBy ?? null,
  reviewedBy: i.reviewedBy ?? null,
  reviewedAt: i.reviewedAt ?? null,
  calendarEvent: i.calendarEvent ?? null,
  createdAt: i.createdAt,
  updatedAt: i.updatedAt,
});

const handleError = (err: any, fallback: string) =>
  err?.response?.data?.message || fallback;

// --- Async Thunks ---
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
    return rejectWithValue(handleError(err, "Failed to fetch user indicators"));
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
    return rejectWithValue(handleError(err, "Failed to fetch indicators"));
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
    return rejectWithValue(handleError(err, "Failed to delete indicator"));
  }
});



export const submitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  SubmitEvidencePayload,
  { rejectValue: string; state: RootState }
>(
  "indicators/submitEvidence",
  async ({ id, files, descriptions }, thunkAPI) => {
    try {
      const formData = new FormData();
      files.forEach((file, idx) => {
        formData.append("evidence", file);
        formData.append("descriptions", descriptions?.[idx] || "");
      });

      const { data } = await api.post(`/indicators/submit/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const indicator = normalizeIndicator(data.indicator);

      // --- Dispatch notification to header ---
      thunkAPI.dispatch(
        addNotification({
          _id: `notif-${Date.now()}`, // temp ID
          title: "Task Submitted",
          message: `Evidence for "${indicator.indicatorTitle}" has been submitted.`,
          read: false,
          createdAt: new Date().toISOString(),
        })
      );

      return indicator;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        handleError(err, "Failed to submit evidence")
      );
    }
  }
);



// --- Slice ---
interface IndicatorState {
  userIndicators: IIndicator[];
  allIndicators: IIndicator[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: IndicatorState = {
  userIndicators: [],
  allIndicators: [],
  loading: false,
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
      .addCase(createIndicator.fulfilled, (state, action) => {
        state.allIndicators.unshift(action.payload);
        state.successMessage = "Indicator created successfully";
      })
      .addCase(updateIndicator.fulfilled, (state, action) => {
        state.userIndicators = state.userIndicators.map((i) =>
          i._id === action.payload._id ? action.payload : i
        );
        state.allIndicators = state.allIndicators.map((i) =>
          i._id === action.payload._id ? action.payload : i
        );
      })
      .addCase(fetchUserIndicators.fulfilled, (state, action) => {
        state.userIndicators = action.payload;
      })
      .addCase(fetchAllIndicatorsForAdmin.fulfilled, (state, action) => {
        state.allIndicators = action.payload;
      })
      .addCase(deleteIndicator.fulfilled, (state, action) => {
        state.userIndicators = state.userIndicators.filter(
          (i) => i._id !== action.payload
        );
        state.allIndicators = state.allIndicators.filter(
          (i) => i._id !== action.payload
        );
      })
      .addCase(submitIndicatorEvidence.fulfilled, (state, action) => {
        state.userIndicators = state.userIndicators.map((i) =>
          i._id === action.payload._id ? action.payload : i
        );
        state.allIndicators = state.allIndicators.map((i) =>
          i._id === action.payload._id ? action.payload : i
        );
        state.successMessage = "Evidence submitted successfully";
      })
      .addMatcher(
        (a) => a.type.startsWith("indicators/") && a.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (a) =>
          a.type.startsWith("indicators/") && a.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (a) => a.type.startsWith("indicators/") && a.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload ?? "Something went wrong";
        }
      );
  },
});

export const selectUserIndicators = (s: RootState) =>
  s.indicators.userIndicators;
export const selectAllIndicators = (s: RootState) => s.indicators.allIndicators;
export const selectIndicatorsLoading = (s: RootState) => s.indicators.loading;
export const selectIndicatorsError = (s: RootState) => s.indicators.error;
export const selectIndicatorsMessage = (s: RootState) =>
  s.indicators.successMessage;

export const { clearMessages } = indicatorSlice.actions;
export default indicatorSlice.reducer;
