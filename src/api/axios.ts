import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AppDispatch } from "../store/store";
import { forceLogout } from "../store/slices/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* =========================
   AXIOS INSTANCE
========================= */

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // required for cookies
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
  resolve: (token?: string) => void;
  reject: (error: AxiosError) => void;
};

let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: AxiosError | null, token?: string) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

/* =========================
   REQUEST INTERCEPTOR
========================= */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Automatically attach accessToken from localStorage if present
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // If sending FormData (files), remove Content-Type to let browser handle boundary
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

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Prevent infinite loops
    if (originalRequest._retry) return Promise.reject(error);
    originalRequest._retry = true;

    // If refreshing failed
    if (originalRequest.url?.includes("/auth/refresh")) {
      localStorage.removeItem("accessToken");
      dispatch?.(forceLogout());
      return Promise.reject(error);
    }

    // Queue requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token?: string) => {
            if (token)
              originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { accessToken } = refreshResponse.data;
      if (!accessToken)
        throw new Error("No access token returned from refresh");

      localStorage.setItem("accessToken", accessToken);

      // Update headers for retrying queued requests
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue(null, accessToken);

      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, undefined);
      localStorage.removeItem("accessToken");
      dispatch?.(forceLogout());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
