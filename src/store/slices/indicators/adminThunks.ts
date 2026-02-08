import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api/axios";
import { normalizeIndicator } from "./normalizers";
import type { IIndicator } from "./types";
import { addNotification } from "../notificationsSlice";

/* =====================================================
   HELPERS
===================================================== */

const createNotif = (title: string, message: string) => ({
  _id: `notif-${Date.now()}`,
  title,
  message,
  read: false,
  createdAt: new Date().toISOString(),
});

/* =====================================================
   ADMIN THUNKS
===================================================== */

export const fetchAllIndicatorsForAdmin = createAsyncThunk<
  IIndicator[],
  void,
  { rejectValue: string }
>("indicators/fetchAllAdmin", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/indicators/all");
    return data.indicators.map(normalizeIndicator);
  } catch (err: any) {
    return rejectWithValue(err?.message ?? "Fetch failed");
  }
});

export const adminSubmitIndicatorEvidence = createAsyncThunk<
  IIndicator,
  { indicatorId: string; files: File[]; descriptions: string[] },
  { rejectValue: string }
>(
  "indicators/adminSubmitEvidence",
  async ({ indicatorId, files, descriptions }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      descriptions.forEach((desc) => formData.append("descriptions", desc));

      const { data } = await api.post(
        `/admin/indicators/${indicatorId}/evidence`,
        formData
      );

      // ✅ Dispatch proper Redux action
      dispatch(
        addNotification(createNotif("Admin Upload", "Evidence bypass completed."))
      );

      return normalizeIndicator(data.indicator);
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Admin upload failed");
    }
  }
);

