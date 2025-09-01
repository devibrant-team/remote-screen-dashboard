import axios from "axios";

// If you want a runtime-editable base URL, you can hook it up later.
// For now, just use your default API base:
// const DEFAULT_BASE_URL = "https://srv964353.hstgr.cloud/api/";
const DEFAULT_BASE_URL = "http://192.168.10.107/remote-screen-backend/public/api/";
export const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  withCredentials: false,
});

// --- Central token attach/detach ---
export const attachToken = (token?: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// --- Optional: automatic error handler (install separately) ---
export const install401Interceptor = (onUnauthorized: () => void) => {
  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        onUnauthorized();
      }
      return Promise.reject(err);
    }
  );
};
