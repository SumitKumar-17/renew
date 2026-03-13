"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { syncQueue } from "@/lib/offline/sync";
import { useAuthStore } from "@/store/authStore";

export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const { token } = useAuthStore();
    const isSyncingRef = useRef(false);

    const triggerSync = useCallback(async () => {
        if (!token || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setIsSyncing(true);
        try {
            await syncQueue(token);
            setLastSynced(new Date());
        } catch (err) {
            console.error("Sync failed:", err);
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
        }
    }, [token]);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            triggerSync();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        if (navigator.onLine) {
            triggerSync();
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [triggerSync]);

    return { isOnline, isSyncing, lastSynced, triggerSync };
};