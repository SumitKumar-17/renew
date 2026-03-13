"use client";

import { Wifi, WifiOff, RefreshCw, LogOut } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useQueueCount } from "@/hooks/useQueueCount";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { C } from "@/lib/utils/tokens";
import { shortId } from "@/lib/utils/shortId";

export const TopBar = () => {
    const { isOnline, isSyncing, triggerSync } = useOnlineStatus();
    const { count: queueCount } = useQueueCount();
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <div style={{
            background: "#1B3829",
            padding: "13px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 50,
        }}>
            {/* Left — App name + operator info */}
            <div>
                <div style={{
                    fontFamily: C.display,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                }}>
                    RENEW HOPE · MRV
                </div>
                <div style={{
                    fontSize: 10,
                    color: "#9DC0AB",
                    fontFamily: C.mono,
                    marginTop: 1,
                }}>
                    {user?.id ? shortId(user.id) : "—"} · {user?.digesterId ? shortId(user.digesterId) : "—"}
                </div>
            </div>

            {/* Right — Status + logout */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

                {/* Pending queue badge */}
                {queueCount > 0 && (
                    <div style={{
                        background: "#CF8025",
                        borderRadius: 20,
                        padding: "3px 9px",
                        fontSize: 11,
                        color: "#fff",
                        fontFamily: C.mono,
                        fontWeight: 600,
                    }}>
                        {queueCount} pending
                    </div>
                )}

                {/* Syncing indicator */}
                {isSyncing && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "#9DC0AB",
                        fontSize: 11,
                    }}>
                        <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                        Syncing...
                    </div>
                )}

                {/* Online / Offline toggle */}
                <button
                    onClick={() => isOnline && triggerSync()}
                    style={{
                        background: isOnline ? "#2D5A3F" : "#B54343",
                        border: "none",
                        borderRadius: 7,
                        padding: "6px 11px",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        cursor: "pointer",
                        color: "#fff",
                        fontSize: 11,
                        fontFamily: C.mono,
                        fontWeight: 600,
                    }}
                >
                    {isOnline
                        ? <><Wifi size={12} /> Online</>
                        : <><WifiOff size={12} /> Offline</>
                    }
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9DC0AB",
                        display: "flex",
                        padding: 4,
                    }}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
};