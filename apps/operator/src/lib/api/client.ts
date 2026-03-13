import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to every request
apiClient.interceptors.request.use(config => {
    const stored = localStorage.getItem("auth_session");
    if (stored) {
        try {
            const { token } = JSON.parse(stored);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch {
            // ignore
        }
    }
    return config;
});

// Handle 401 — token expired
apiClient.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Try refresh
            const stored = localStorage.getItem("auth_session");
            if (stored) {
                try {
                    const { refreshToken } = JSON.parse(stored);
                    const res = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                        { refreshToken }
                    );
                    const newToken = res.data.data.accessToken;

                    // Update stored token
                    const parsed = JSON.parse(stored);
                    parsed.token = newToken;
                    localStorage.setItem("auth_session", JSON.stringify(parsed));

                    // Retry original request
                    if (error.config) {
                        error.config.headers.Authorization = `Bearer ${newToken}`;
                        return axios(error.config);
                    }
                } catch {
                    // Refresh failed — clear auth
                    localStorage.removeItem("auth_session");
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);