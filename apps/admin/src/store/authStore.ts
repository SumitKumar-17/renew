"use client";

import { create } from "zustand";

interface AdminUser {
    id: string;
    name: string;
    role: string;
    status: string;
}

interface AuthStore {
    user: AdminUser | null;
    token: string | null;
    isLoaded: boolean;

    setAuth: (user: AdminUser, token: string) => void;
    logout: () => void;
    loadAuth: () => void;
}

const SESSION_KEY = "admin_session";

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    token: null,
    isLoaded: false,

    setAuth: (user, token) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
        set({ user, token, isLoaded: true });
    },

    logout: () => {
        localStorage.removeItem(SESSION_KEY);
        set({ user: null, token: null });
    },

    loadAuth: () => {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
            try {
                const { user, token } = JSON.parse(stored);
                set({ user, token, isLoaded: true });
                return;
            } catch {
                localStorage.removeItem(SESSION_KEY);
            }
        }
        set({ isLoaded: true });
    },
}));
