"use client";

import { useState, useEffect } from "react";
import { getQueueCount } from "@/lib/offline/queue";
import { db } from "@/lib/offline/db";

export const useQueueCount = () => {
    const [count, setCount] = useState(0);

    const refresh = async () => {
        const n = await getQueueCount();
        setCount(n);
    };

    useEffect(() => {
        refresh();

        // Re-check every 3 seconds
        const interval = setInterval(refresh, 3000);
        return () => clearInterval(interval);
    }, []);

    return { count, refresh };
};