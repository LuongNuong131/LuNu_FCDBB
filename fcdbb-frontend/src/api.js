import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const attachAuth = (client) => {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem("fcdbb_token");
    const target = new URL(client.getUri(config), window.location.origin);
    const base = new URL(baseURL, window.location.origin);
    if (
      token &&
      target.origin === base.origin &&
      (target.pathname === base.pathname ||
        target.pathname.startsWith(`${base.pathname}/`))
    )
      config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        error.response?.status === 401 &&
        !error.config?.url?.includes("/auth/login")
      ) {
        localStorage.removeItem("fcdbb_token");
        localStorage.removeItem("fcdbb_user");
        if (window.location.pathname !== "/login")
          window.location.assign("/login");
      }
      return Promise.reject(error);
    },
  );
};
attachAuth(axios);
attachAuth(api);
export default api;
