import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If token expires, redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isExemptRoute = 
      error.config?.url?.includes("/users/login") || 
      error.config?.url?.includes("/users/password") ||
      error.config?.url?.includes("/users/forgot-password") ||
      error.config?.url?.includes("/users/reset-password");
    if (error.response?.status === 401 && !isExemptRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
export default api;
