"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui";
import { C } from "@/lib/utils/tokens";

export const AuthGuard = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { user, isLoaded, loadAuth } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        loadAuth();
    }, []);

    useEffect(() => {
        if (isLoaded && !user) {
            router.replace("/login");
        }
    }, [isLoaded, user]);

    if (!isLoaded) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    background: C.bg,
                }}
            >
                <Spinner />
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
};