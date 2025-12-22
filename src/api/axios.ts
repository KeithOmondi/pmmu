import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import type { AppDispatch } from "../store/store";
import { logout } from "../store/slices/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: new AxiosHeaders({ "Content-Type": "application/json" }),
});

// Token getter reads directly from localStorage for persistence
let getToken: () => string | null = () => localStorage.getItem("accessToken");
let dispatch: AppDispatch | null = null;

// ========================
// INJECTORS
// ========================
export const injectDispatch = (d: AppDispatch) => {
  dispatch = d;
};

// ========================
// REQUEST INTERCEPTOR
// ========================
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = new AxiosHeaders(config.headers);
  }

  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// ========================
// RESPONSE INTERCEPTOR
// ========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto logout on 401 Unauthorized
    if (error.response?.status === 401 && dispatch) {
      console.warn("401 Unauthorized — logging out user");
      dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
