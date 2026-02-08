import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import api from "../../../api/axios";
import { addNotification } from "../notificationsSlice";
import type { AxiosError } from "axios";

import type {
  IIndicator,
  CreateIndicatorPayload,
  UpdateIndicatorPayload,
} from "./types";

import { normalizeIndicator } from "./normalizers";

import {
  submitIndicatorEvidence,
  adminSubmitIndicatorEvidence,
  deleteIndicatorEvidence,
} from "./evidenceSlice";

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

const syncIndicatorLists = (
  state: IndicatorState,
  indicator: IIndicator,
) => {
  state.allIndicators = updateList(state.allIndicators, indicator);
  state.userIndicators = updateList(state.userIndicators, indicator);
  state.submittedIndicators = updateList(
    state.submittedIndicators,
    indicator,
  );
};

/* =====================================================
   STATE
===================================================== */

interface IndicatorState {
  userIndicators: IIndicator[];
  allIndicators: IIndicator[];
  submittedIndicators: IIndicator[];
  loading: boolean;
  error: string | null;
}

const initialState: IndicatorState = {
  userIndicators: [],
  allIndicators: [],
  submittedIndicators: [],
  loading: false,
  error: null,
};

/* =====================================================
   THUNKS — INDICATORS
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
>("indicators/update", async ({ id, updates }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/update/${id}`, updates);

    dispatch(addNotification(createNotif("Success", "Indicator updated.")));

    return normalizeIndicator(data.indicator);
  } catch (err) {
    return rejectWithValue(handleError(err, "Update failed"));
  }
});

export const approveIndicator = createAsyncThunk<
  IIndicator,
  { id: string; notes?: string },
  { rejectValue: string }
>("indicators/approve", async ({ id, notes }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/approve/${id}`, { notes });

    dispatch(addNotification(createNotif("Verified", "Indicator approved.")));

    return normalizeIndicator(data.indicator);
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

    dispatch(addNotification(createNotif("Returned", "Sent for correction.")));

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

    dispatch(addNotification(createNotif("Removed", "Indicator deleted.")));

    return id;
  } catch (err) {
    return rejectWithValue(handleError(err, "Deletion failed"));
  }
});

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
  },
  extraReducers: (builder) => {
    builder

      /* ---------- FETCH ---------- */

      .addCase(fetchAllIndicatorsForAdmin.fulfilled, (s, a) => {
        s.allIndicators = a.payload;
      })
      .addCase(fetchUserIndicators.fulfilled, (s, a) => {
        s.userIndicators = a.payload;
      })
      .addCase(fetchSubmittedIndicators.fulfilled, (s, a) => {
        s.submittedIndicators = a.payload;
      })

      /* ---------- CREATE / DELETE ---------- */

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

      /* ---------- UPDATE FLOWS ---------- */

      .addCase(updateIndicator.fulfilled, (s, a) => {
        syncIndicatorLists(s, a.payload);
      })
      .addCase(approveIndicator.fulfilled, (s, a) => {
        syncIndicatorLists(s, a.payload);
      })
      .addCase(rejectIndicator.fulfilled, (s, a) => {
        syncIndicatorLists(s, a.payload);
      })

      /* ---------- EVIDENCE SIDE EFFECTS ---------- */

      .addCase(submitIndicatorEvidence.fulfilled, (s, a) => {
        syncIndicatorLists(s, a.payload);
      })
      .addCase(adminSubmitIndicatorEvidence.fulfilled, (s, a) => {
        syncIndicatorLists(s, a.payload);
      })
      .addCase(deleteIndicatorEvidence.fulfilled, (s, a) => {
        syncIndicatorLists(s, a.payload);
      })

      /* ---------- GENERIC STATUS ---------- */

      .addMatcher(
        (a) => a.type.endsWith("/pending"),
        (s) => {
          s.loading = true;
          s.error = null;
        },
      )
      .addMatcher(
        (a) => a.type.endsWith("/fulfilled") || a.type.endsWith("/rejected"),
        (s, a: any) => {
          s.loading = false;

          if (a.type.endsWith("/rejected")) {
            s.error = a.payload || "Unexpected error";
          }
        },
      );
  },
});

export const { clearMessages } = indicatorSlice.actions;



export default indicatorSlice.reducer;
