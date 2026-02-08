import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AppDispatch } from "../store/store";
import { forceLogout } from "../store/slices/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* =========================
   AXIOS INSTANCE
========================= */

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   DISPATCH INJECTION
========================= */

let dispatch: AppDispatch | null = null;

export const injectDispatch = (d: AppDispatch) => {
  dispatch = d;
};

/* =========================
   REFRESH QUEUE HANDLING
========================= */

let isRefreshing = false;

type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
};

let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
};

/* =========================
   REQUEST INTERCEPTOR
========================= */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /* --- THE FIX --- */
    // If we are sending FormData (files), we MUST delete the default Content-Type header.
    // This allows the browser to automatically set it to 'multipart/form-data' 
    // and include the essential 'boundary' parameter.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    // Only handle 401s
    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    /* =========================
       IF REFRESH ITSELF FAILS
    ========================= */

    if (originalRequest.url?.includes("/auth/refresh")) {
      localStorage.removeItem("accessToken");
      if (dispatch) dispatch(forceLogout());
      return Promise.reject(error);
    }

    /* =========================
       QUEUE IF ALREADY REFRESHING
    ========================= */

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    /* =========================
       START REFRESH FLOW
    ========================= */

    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { accessToken } = refreshResponse.data;

      if (!accessToken) {
        throw new Error("Refresh succeeded but no access token returned");
      }

      localStorage.setItem("accessToken", accessToken);

      // Update both the instance defaults and the current failed request
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue(null, accessToken);

      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, null);
      localStorage.removeItem("accessToken");
      if (dispatch) dispatch(forceLogout());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;