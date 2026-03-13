import { apiClient } from "./client";
import { db } from "../offline/db";

export const authApi = {

    login: async (id: string, password: string) => {
        // Auth always requires internet — cannot login offline
        const res = await apiClient.post("/auth/login", { id, password });
        const { accessToken, refreshToken, user } = res.data.data;

        // Persist to localStorage — survives refresh
        localStorage.setItem(
            "auth_session",
            JSON.stringify({ user, token: accessToken, refreshToken })
        );

        return { user, token: accessToken, refreshToken };
    },

    refresh: async (refreshToken: string) => {
        const res = await apiClient.post("/auth/refresh", { refreshToken });
        const { accessToken } = res.data.data;

        // Update stored token
        const stored = localStorage.getItem("auth_session");
        if (stored) {
            const parsed = JSON.parse(stored);
            parsed.token = accessToken;
            localStorage.setItem("auth_session", JSON.stringify(parsed));
        }

        return accessToken;
    },

    logout: async () => {
        try {
            await apiClient.post("/auth/logout");
        } catch {
            // Ignore — logout locally regardless
        } finally {
            // Clear auth
            localStorage.removeItem("auth_session");

            // Clear all cached data from IndexedDB
            await db.feedstock.clear();
            await db.meter.clear();
            await db.distribution.clear();
            await db.compost.clear();
            await db.households.clear();
            await db.queue.clear();
        }
    },

    // Load session from localStorage on app boot
    loadSession: () => {
        try {
            const stored = localStorage.getItem("auth_session");
            if (!stored) return null;
            return JSON.parse(stored) as {
                user: {
                    id: string;
                    name: string;
                    role: string;
                    digesterId: string | null;
                    status: string;
                };
                token: string;
                refreshToken: string;
            };
        } catch {
            return null;
        }
    },

};