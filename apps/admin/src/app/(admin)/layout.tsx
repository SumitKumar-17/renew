"use client";

import { usePathname, useRouter } from "next/navigation";
import {
    BarChart3,
    Database,
    Users,
    Home,
    Package,
    Download,
    Flame,
    LogOut,
} from "lucide-react";
import { C } from "@/lib/utils/tokens";
import { useAuthStore } from "@/store/authStore";
import AuthGuard from "@/components/layout/AuthGuard";

const NAV_ITEMS = [
    { href: "/overview",    label: "Overview",    icon: BarChart3 },
    { href: "/digesters",   label: "Digesters",   icon: Database },
    { href: "/operators",   label: "Operators",   icon: Users },
    { href: "/households",  label: "Households",  icon: Home },
    { href: "/compost",     label: "Compost",     icon: Package },
    { href: "/export",      label: "Export",      icon: Download },
];

function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.replace("/login");
    };

    return (
        <div
            style={{
                width: 220,
                background: C.primary,
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                position: "sticky",
                top: 0,
                flexShrink: 0,
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: "24px 20px 18px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: C.accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Flame size={17} color="#fff" />
                    </div>
                    <div>
                        <div
                            style={{
                                fontFamily: C.display,
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: 0.5,
                            }}
                        >
                            RENEW HOPE
                        </div>
                        <div
                            style={{
                                fontFamily: C.mono,
                                color: "#9DC0AB",
                                fontSize: 9,
                                letterSpacing: 2,
                            }}
                        >
                            MRV PLATFORM
                        </div>
                    </div>
                </div>
                {/* User badge */}
                <div
                    style={{
                        background: "#ffffff12",
                        borderRadius: 8,
                        padding: "9px 12px",
                    }}
                >
                    <div
                        style={{
                            fontSize: 9,
                            color: "#9DC0AB",
                            fontFamily: C.mono,
                            letterSpacing: 1.5,
                            marginBottom: 2,
                        }}
                    >
                        ADMIN
                    </div>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: C.sans }}>
                        {user?.name ?? "Admin"}
                    </div>
                    <div style={{ color: "#9DC0AB", fontSize: 11, fontFamily: C.mono }}>
                        {user?.id}
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto" }}>
                {NAV_ITEMS.map(item => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                width: "100%",
                                padding: "10px 12px",
                                background: active ? "#ffffff18" : "none",
                                border: "none",
                                borderRadius: 8,
                                color: active ? "#fff" : "#9DC0AB",
                                fontSize: 13,
                                fontWeight: 500,
                                fontFamily: C.sans,
                                textAlign: "left",
                                cursor: "pointer",
                                transition: "background 0.12s",
                                marginBottom: 3,
                            }}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Sign out */}
            <div style={{ padding: "12px 12px 20px" }}>
                <button
                    onClick={handleLogout}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "10px 12px",
                        background: "none",
                        border: "none",
                        borderRadius: 8,
                        color: "#9DC0AB",
                        fontSize: 13,
                        fontFamily: C.sans,
                        cursor: "pointer",
                    }}
                >
                    <LogOut size={15} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div style={{ display: "flex", height: "100vh", background: C.bg }}>
                <AdminSidebar />
                <main
                    style={{
                        flex: 1,
                        overflow: "auto",
                        padding: 36,
                    }}
                >
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
