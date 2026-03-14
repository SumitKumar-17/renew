import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: false,
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use(config => {
    const stored = typeof window !== "undefined"
        ? localStorage.getItem("admin_session")
        : null;
    if (stored) {
        try {
            const { token } = JSON.parse(stored);
            if (token) config.headers["Authorization"] = `Bearer ${token}`;
        } catch { /* ignore */ }
    }
    return config;
});
