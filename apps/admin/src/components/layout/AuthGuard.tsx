"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoaded, loadAuth } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        loadAuth();
    }, [loadAuth]);

    useEffect(() => {
        if (isLoaded && !user) {
            router.replace("/login");
        }
    }, [isLoaded, user, router]);

    if (!isLoaded) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    background: "#1B3829",
                    color: "#fff",
                    fontFamily: "sans-serif",
                    fontSize: 14,
                }}
            >
                Loading…
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
}
