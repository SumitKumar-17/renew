/**
 * loading.tsx — Dashboard route loading state
 * Next.js automatically shows this while the page component suspends.
 * Mirrors the exact card layout of the dashboard for zero layout shift.
 */

import { C } from "@/lib/utils/tokens";

function Bone({ w = "100%", h = 16, r = 6 }: { w?: string | number; h?: number; r?: number }) {
    return (
        <div
            style={{
                width: w,
                height: h,
                borderRadius: r,
                background: "linear-gradient(90deg, #E8E2D8 25%, #F0EBE0 50%, #E8E2D8 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s ease-in-out infinite",
            }}
        />
    );
}

export default function DashboardLoading() {
    return (
        <>
            <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

            <div
                style={{
                    minHeight: "100%",
                    background: C.bg,
                    fontFamily: C.sans,
                    paddingBottom: 90,
                }}
            >
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <Bone w={100} h={20} />
                            <Bone w={140} h={11} />
                        </div>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: C.card, border: `1px solid ${C.border}`,
                        }} />
                    </div>

                    {/* Digester card skeleton */}
                    <div style={{
                        background: C.primary,
                        borderRadius: 16,
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}>
                        <Bone w={80} h={10} />
                        <Bone w="40%" h={26} />
                        <Bone w="65%" h={13} />
                        <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                            <Bone w={50} h={24} />
                            <Bone w={80} h={24} />
                        </div>
                    </div>

                    {/* Gas balance card skeleton */}
                    <div style={{
                        background: C.card,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        padding: "16px 18px",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                            <Bone w={80} h={14} />
                            <Bone w={60} h={22} r={99} />
                        </div>
                        <div style={{ display: "flex" }}>
                            {[0, 1, 2].map((i) => (
                                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <Bone w={55} h={26} />
                                    <Bone w={50} h={10} />
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 14 }}>
                            <Bone w="100%" h={5} r={99} />
                        </div>
                    </div>

                    {/* Two stat cards */}
                    <div style={{ display: "flex", gap: 10 }}>
                        {[0, 1].map((i) => (
                            <div key={i} style={{
                                flex: 1,
                                background: C.card,
                                borderRadius: 14,
                                padding: "16px 18px",
                                border: `1px solid ${C.border}`,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}>
                                <Bone w="60%" h={10} />
                                <Bone w="70%" h={26} />
                                <Bone w="50%" h={11} />
                            </div>
                        ))}
                    </div>

                    {/* Checklist skeleton */}
                    <div style={{
                        background: C.card,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        padding: "16px 18px",
                    }}>
                        <Bone w={130} h={14} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                            {[0, 1].map((i) => (
                                <div key={i} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 12px",
                                    background: C.bg,
                                    borderRadius: 10,
                                    border: `1px solid ${C.border}`,
                                }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.border }} />
                                    <Bone w="55%" h={13} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent activity skeleton */}
                    <div style={{
                        background: C.card,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            padding: "14px 18px 12px",
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: `1px solid ${C.border}`,
                        }}>
                            <Bone w={110} h={14} />
                            <Bone w={60} h={12} />
                        </div>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} style={{
                                padding: "12px 18px",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
                            }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: C.bg, flexShrink: 0 }} />
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                                    <Bone w="55%" h={12} />
                                    <Bone w="35%" h={10} />
                                </div>
                                <Bone w={50} h={18} r={99} />
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
}