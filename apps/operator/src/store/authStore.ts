import { create } from "zustand";
import { db } from "@/lib/offline/db";
import { clearQueue } from "@/lib/offline/queue";

interface AuthUser {
    id: string;
    name: string;
    role: "admin" | "operator";
    status: string;
    digesterId: string | null;
}

interface AuthStore {
    user: AuthUser | null;
    token: string | null;
    refreshToken: string | null;
    isLoaded: boolean;

    setAuth: (user: AuthUser, token: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    loadAuth: () => Promise<void>;
}

// Keys for IndexedDB persistence
const AUTH_KEY = "auth_session";

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    token: null,
    refreshToken: null,
    isLoaded: false,

    setAuth: async (user, token, refreshToken) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token, refreshToken }));
        set({ user, token, refreshToken, isLoaded: true });
    },

    logout: async () => {
        // Clear auth from storage
        localStorage.removeItem(AUTH_KEY);

        // Clear offline queue — important
        // Operator logged out while offline — queue must be cleared
        await clearQueue();

        // Clear all cached data
        await db.feedstock.clear();
        await db.meter.clear();
        await db.distribution.clear();
        await db.compost.clear();
        await db.households.clear();

        set({ user: null, token: null, refreshToken: null });
    },

    loadAuth: async () => {
        // Try localStorage first (simpler)
        const stored = localStorage.getItem(AUTH_KEY);
        if (stored) {
            try {
                const { user, token, refreshToken } = JSON.parse(stored);
                set({ user, token, refreshToken, isLoaded: true });
                return;
            } catch {
                localStorage.removeItem(AUTH_KEY);
            }
        }
        set({ isLoaded: true });
    },
}));