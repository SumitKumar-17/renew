"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Leaf,
    Activity,
    Share2,
    Package,
    Users,
    ClipboardList,
} from "lucide-react";
import { C } from "@/lib/utils/tokens";

const NAV = [
    { id: "dashboard", label: "Home", icon: Home, href: "/dashboard" },
    { id: "feedstock", label: "Feedstock", icon: Leaf, href: "/feedstock" },
    { id: "meter", label: "Gas Log", icon: Activity, href: "/meter" },
    { id: "distribution", label: "Distribute", icon: Share2, href: "/distribution" },
    { id: "compost", label: "Compost", icon: Package, href: "/compost" },
    { id: "households", label: "Add HH", icon: Users, href: "/households/register" },
    { id: "history", label: "History", icon: ClipboardList, href: "/history" },
];

export const BottomNav = () => {
    const pathname = usePathname();

    return (
        <nav
            style={{
                position: "fixed",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "100%",
                maxWidth: 480,
                background: "#fff",
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                zIndex: 100,
                boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
            }}
        >
            {NAV.map(item => {
                const active = pathname.startsWith(`/${item.id}`) ||
                    (item.id === "dashboard" && pathname === "/dashboard");

                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "10px 2px 8px",
                            minHeight: 56,
                            textDecoration: "none",
                            color: active ? C.primary : C.muted,
                            borderTop: active ? `2px solid ${C.primary}` : "2px solid transparent",
                        }}
                    >
                        <item.icon
                            size={18}
                            strokeWidth={active ? 2.5 : 1.8}
                        />
                        <span
                            style={{
                                fontSize: 9,
                                marginTop: 3,
                                fontFamily: C.sans,
                                fontWeight: active ? 700 : 400,
                                lineHeight: 1,
                            }}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};