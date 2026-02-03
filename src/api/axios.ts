import axios from "axios";
import type { AppDispatch } from "../store/store";
import { logout } from "../store/slices/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // needed for refresh cookie
  headers: {"Content-Type": "application/json",},
});

let dispatch: AppDispatch | null = null;

export const injectDispatch = (d: AppDispatch) => {
  dispatch = d;
};

/* ========================
   REQUEST INTERCEPTOR
   → attach access token
======================== */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ========================
   RESPONSE INTERCEPTOR
======================== */
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(null);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      dispatch
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh");

        // ✅ STORE NEW ACCESS TOKEN
        localStorage.setItem("accessToken", data.accessToken);

        isRefreshing = false;
        processQueue(null);

        return api(originalRequest);
      } catch (err) {
        isRefreshing = false;
        processQueue(err);
        localStorage.removeItem("accessToken");
        dispatch(logout());
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
