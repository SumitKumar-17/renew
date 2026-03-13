"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Flame,
    Users,
    BarChart3,
    AlertTriangle,
    CheckCircle,
    Leaf,
    Gauge,
    Activity,
    Package,
    ChevronRight,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Minus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { dashboardApi, type DashboardSummary } from "@/lib/api/dashboard.api";
import { useAuthStore } from "@/store/authStore";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { C } from "@/lib/utils/tokens";

// ─── Types ──────────────────────────────────────────────────────────────────
type ActivityType = "feedstock" | "meter" | "distribution" | "compost";

interface RecentActivityItem {
    type: ActivityType;
    date: string;
    summary: string;
    synced: boolean;
    id: string;
}

// ─── Skeleton Component ─────────────────────────────────────────────────────
function Skeleton({ width = "100%", height = 16, radius = 6 }: {
    width?: string | number;
    height?: number;
    radius?: number;
}) {
    return (
        <div
            style={{
                width,
                height,
                borderRadius: radius,
                background: "linear-gradient(90deg, #E8E2D8 25%, #F0EBE0 50%, #E8E2D8 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s ease-in-out infinite",
            }}
        />
    );
}

// ─── Activity Icon ──────────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: ActivityType }) {
    const iconProps = { size: 14 };
    const configs: Record<ActivityType, { icon: React.ReactNode; bg: string; color: string }> = {
        feedstock: { icon: <Package {...iconProps} />, bg: "#F0F9F4", color: C.success },
        meter: { icon: <Gauge {...iconProps} />, bg: "#EEF4FF", color: C.info },
        distribution: { icon: <Flame {...iconProps} />, bg: "#FFF7ED", color: C.accent },
        compost: { icon: <Leaf {...iconProps} />, bg: "#F0F9F4", color: "#5C6B22" },
    };
    const cfg = configs[type];
    return (
        <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: cfg.bg,
            color: cfg.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        }}>
            {cfg.icon}
        </div>
    );
}

// ─── Gas Balance Indicator ──────────────────────────────────────────────────
function BalanceTrend({ surplus, isDeficit }: { surplus: number; isDeficit: boolean }) {
    if (isDeficit) return <TrendingDown size={14} color={C.danger} />;
    if (surplus === 0) return <Minus size={14} color={C.muted} />;
    return <TrendingUp size={14} color={C.success} />;
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    unit,
    sub,
    accent,
    loading,
}: {
    label: string;
    value: string | number;
    unit?: string;
    sub?: string;
    accent?: boolean;
    loading?: boolean;
}) {
    return (
        <div style={{
            background: C.card,
            borderRadius: 14,
            padding: "16px 18px",
            border: `1px solid ${C.border}`,
            flex: 1,
            minWidth: 0,
        }}>
            <div style={{
                fontSize: 10,
                fontFamily: C.mono,
                color: C.muted,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 8,
            }}>
                {label}
            </div>
            {loading ? (
                <>
                    <Skeleton height={28} width="70%" radius={6} />
                    <div style={{ marginTop: 6 }}><Skeleton height={12} width="50%" /></div>
                </>
            ) : (
                <>
                    <div style={{
                        fontSize: 24,
                        fontFamily: C.display,
                        fontWeight: 700,
                        color: accent ? C.accent : C.text,
                        lineHeight: 1.1,
                    }}>
                        {value}
                        {unit && (
                            <span style={{ fontSize: 12, fontFamily: C.mono, color: C.muted, marginLeft: 4 }}>
                                {unit}
                            </span>
                        )}
                    </div>
                    {sub && (
                        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.sans, marginTop: 4 }}>
                            {sub}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Main Dashboard Page ────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user } = useAuthStore();
    const { isOnline } = useOnlineStatus();
    const router = useRouter();

    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchDashboard = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const summary = await dashboardApi.getSummary();
            setData(summary);
            setLastUpdated(new Date());
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load dashboard";
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Re-fetch when coming back online
    useEffect(() => {
        if (isOnline && data) {
            fetchDashboard(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const activityTypeLabel: Record<ActivityType, string> = {
        feedstock: "Feedstock",
        meter: "Meter Reading",
        distribution: "Distribution",
        compost: "Compost",
    };

    return (
        <>
            {/* Global shimmer keyframe */}
            <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

            <div style={{
                minHeight: "100%",
                background: C.bg,
                fontFamily: C.sans,
                paddingBottom: 90, // BottomNav clearance
                animation: "fadeUp 0.22s ease",
            }}>

                {/* ── Offline Banner ─────────────────────────────────────────── */}
                {!isOnline && (
                    <div style={{
                        background: "#FEF3C7",
                        borderBottom: `1px solid #FDE68A`,
                        padding: "8px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        color: C.warning,
                        fontFamily: C.mono,
                        fontWeight: 500,
                    }}>
                        <AlertTriangle size={13} />
                        Offline — showing cached data
                    </div>
                )}

                {/* ── Today Alert Banner ─────────────────────────────────────── */}
                {!loading && data && !data.todayStatus.isComplete && (
                    <div style={{
                        margin: "14px 16px 0",
                        background: "#FFF7ED",
                        border: `1px solid #FDE8C8`,
                        borderRadius: 10,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}>
                        <AlertTriangle size={15} color={C.warning} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.warning, fontFamily: C.sans }}>
                                Today&apos;s entries pending
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                                {!data.todayStatus.feedstockLogged && "Feedstock "}
                                {!data.todayStatus.meterLogged && "Meter Reading "}
                                not yet logged
                            </div>
                        </div>
                        <button
                            onClick={() => router.push(!data.todayStatus.feedstockLogged ? "/feedstock" : "/meter")}
                            style={{
                                background: C.accent,
                                color: "#fff",
                                border: "none",
                                borderRadius: 7,
                                padding: "5px 12px",
                                fontSize: 11,
                                fontFamily: C.sans,
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Log Now
                        </button>
                    </div>
                )}

                {/* ── Error State ────────────────────────────────────────────── */}
                {error && !loading && (
                    <div style={{
                        margin: "14px 16px 0",
                        background: "#FEF2F2",
                        border: `1px solid #FECACA`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}>
                        <AlertTriangle size={15} color={C.danger} />
                        <div style={{ flex: 1, fontSize: 12, color: C.danger }}>{error}</div>
                        <button
                            onClick={() => fetchDashboard()}
                            style={{
                                background: C.danger,
                                color: "#fff",
                                border: "none",
                                borderRadius: 7,
                                padding: "5px 12px",
                                fontSize: 11,
                                fontFamily: C.sans,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* ── Header Row ───────────────────────────────────────────── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <div style={{
                                fontSize: 18,
                                fontFamily: C.display,
                                fontWeight: 700,
                                color: C.text,
                            }}>
                                Dashboard
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, marginTop: 2 }}>
                                {lastUpdated
                                    ? `Updated ${formatTime(lastUpdated)}`
                                    : isOnline ? "Fetching data…" : "Cached data"}
                            </div>
                        </div>

                        <button
                            onClick={() => fetchDashboard(true)}
                            disabled={refreshing}
                            title="Refresh"
                            style={{
                                background: C.card,
                                border: `1px solid ${C.border}`,
                                borderRadius: 10,
                                width: 38,
                                height: 38,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: refreshing ? "not-allowed" : "pointer",
                                color: refreshing ? C.muted : C.primary,
                            }}
                        >
                            <RefreshCw
                                size={15}
                                style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }}
                            />
                        </button>
                    </div>

                    {/* ── Digester Card ─────────────────────────────────────────── */}
                    <div style={{
                        background: C.primary,
                        borderRadius: 16,
                        padding: "18px 20px",
                        color: "#fff",
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        {/* Decorative circle */}
                        <div style={{
                            position: "absolute",
                            top: -30,
                            right: -30,
                            width: 110,
                            height: 110,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.05)",
                            pointerEvents: "none",
                        }} />
                        <div style={{
                            position: "absolute",
                            bottom: -20,
                            right: 40,
                            width: 70,
                            height: 70,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.04)",
                            pointerEvents: "none",
                        }} />

                        <div style={{
                            fontSize: 10,
                            fontFamily: C.mono,
                            color: "#9DC0AB",
                            letterSpacing: 1.2,
                            textTransform: "uppercase",
                            marginBottom: 10,
                        }}>
                            Assigned Digester
                        </div>

                        {loading ? (
                            <>
                                <Skeleton height={26} width="40%" radius={6} />
                                <div style={{ marginTop: 8 }}><Skeleton height={13} width="65%" /></div>
                                <div style={{ marginTop: 6 }}><Skeleton height={13} width="50%" /></div>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    fontSize: 26,
                                    fontFamily: C.display,
                                    fontWeight: 800,
                                    letterSpacing: -0.5,
                                    marginBottom: 6,
                                }}>
                                    {data?.digester.id ?? user?.digesterId ?? "—"}
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: "#B8D4C0",
                                    fontFamily: C.sans,
                                    marginBottom: 12,
                                }}>
                                    {data?.digester.location ?? "Location not set"}
                                </div>

                                {/* Stats row */}
                                <div style={{ display: "flex", gap: 20 }}>
                                    <div>
                                        <div style={{
                                            fontSize: 18,
                                            fontFamily: C.display,
                                            fontWeight: 700,
                                            color: C.accentLight,
                                        }}>
                                            {data?.householdCount ?? "—"}
                                        </div>
                                        <div style={{ fontSize: 10, color: "#9DC0AB", fontFamily: C.mono }}>
                                            Households
                                        </div>
                                    </div>

                                    <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />

                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            {data?.todayStatus.isComplete ? (
                                                <CheckCircle size={16} color="#52D68A" />
                                            ) : (
                                                <AlertTriangle size={16} color={C.accentLight} />
                                            )}
                                            <span style={{
                                                fontSize: 13,
                                                fontFamily: C.sans,
                                                fontWeight: 600,
                                                color: data?.todayStatus.isComplete ? "#52D68A" : C.accentLight,
                                            }}>
                                                {data?.todayStatus.isComplete ? "Logged Today" : "Pending"}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 10, color: "#9DC0AB", fontFamily: C.mono, marginTop: 1 }}>
                                            Today&apos;s Status
                                        </div>
                                    </div>

                                    {data?.streak !== undefined && data.streak > 0 && (
                                        <>
                                            <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
                                            <div>
                                                <div style={{
                                                    fontSize: 18,
                                                    fontFamily: C.display,
                                                    fontWeight: 700,
                                                    color: C.accentLight,
                                                }}>
                                                    {data.streak}d
                                                </div>
                                                <div style={{ fontSize: 10, color: "#9DC0AB", fontFamily: C.mono }}>
                                                    Streak
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Gas Balance Card ──────────────────────────────────────── */}
                    <div style={{
                        background: C.card,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        padding: "16px 18px",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 14,
                        }}>
                            <div style={{
                                fontSize: 12,
                                fontFamily: C.display,
                                fontWeight: 700,
                                color: C.text,
                            }}>
                                Gas Balance
                            </div>
                            {!loading && data && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 11,
                                    fontFamily: C.mono,
                                    color: data.gasBalance.isDeficit ? C.danger : C.success,
                                    background: data.gasBalance.isDeficit ? "#FEF2F2" : "#F0F9F4",
                                    borderRadius: 20,
                                    padding: "3px 9px",
                                }}>
                                    <BalanceTrend
                                        surplus={data.gasBalance.surplus}
                                        isDeficit={data.gasBalance.isDeficit}
                                    />
                                    {data.gasBalance.isDeficit ? "Deficit" : "Balanced"}
                                </div>
                            )}
                        </div>

                        {/* Three stat columns */}
                        <div style={{ display: "flex", gap: 0 }}>
                            {/* Produced */}
                            <div style={{ flex: 1, textAlign: "center" }}>
                                {loading ? (
                                    <>
                                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                                            <Skeleton height={28} width={60} />
                                        </div>
                                        <Skeleton height={11} width={50} />
                                    </>
                                ) : (
                                    <>
                                        <div style={{
                                            fontSize: 22,
                                            fontFamily: C.display,
                                            fontWeight: 700,
                                            color: C.primary,
                                        }}>
                                            {data?.gasBalance.totalProduced.toFixed(1) ?? "—"}
                                            <span style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, marginLeft: 2 }}>
                                                m³
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, marginTop: 3 }}>
                                            Produced
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ width: 1, background: C.border }} />

                            {/* Distributed */}
                            <div style={{ flex: 1, textAlign: "center" }}>
                                {loading ? (
                                    <>
                                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                                            <Skeleton height={28} width={60} />
                                        </div>
                                        <Skeleton height={11} width={60} />
                                    </>
                                ) : (
                                    <>
                                        <div style={{
                                            fontSize: 22,
                                            fontFamily: C.display,
                                            fontWeight: 700,
                                            color: C.accent,
                                        }}>
                                            {data?.gasBalance.totalDistributed.toFixed(1) ?? "—"}
                                            <span style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, marginLeft: 2 }}>
                                                m³
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, marginTop: 3 }}>
                                            Distributed
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ width: 1, background: C.border }} />

                            {/* Surplus */}
                            <div style={{ flex: 1, textAlign: "center" }}>
                                {loading ? (
                                    <>
                                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                                            <Skeleton height={28} width={60} />
                                        </div>
                                        <Skeleton height={11} width={45} />
                                    </>
                                ) : (
                                    <>
                                        <div style={{
                                            fontSize: 22,
                                            fontFamily: C.display,
                                            fontWeight: 700,
                                            color: data?.gasBalance.isDeficit ? C.danger : C.success,
                                        }}>
                                            {data?.gasBalance.surplus.toFixed(1) ?? "—"}
                                            <span style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, marginLeft: 2 }}>
                                                m³
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, marginTop: 3 }}>
                                            Surplus
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Progress bar — distributed vs produced */}
                        {!loading && data && data.gasBalance.totalProduced > 0 && (
                            <div style={{ marginTop: 14 }}>
                                <div style={{
                                    height: 5,
                                    background: C.border,
                                    borderRadius: 99,
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${Math.min(
                                            100,
                                            (data.gasBalance.totalDistributed / data.gasBalance.totalProduced) * 100
                                        )}%`,
                                        background: data.gasBalance.isDeficit
                                            ? C.danger
                                            : `linear-gradient(90deg, ${C.success}, ${C.accentLight})`,
                                        borderRadius: 99,
                                        transition: "width 0.6s ease",
                                    }} />
                                </div>
                                <div style={{
                                    fontSize: 10,
                                    fontFamily: C.mono,
                                    color: C.muted,
                                    marginTop: 5,
                                    textAlign: "right",
                                }}>
                                    {Math.round(
                                        (data.gasBalance.totalDistributed / data.gasBalance.totalProduced) * 100
                                    )}% distributed
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Stats Row — Feedstock + Last Meter ───────────────────── */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <StatCard
                            label="Total Feedstock"
                            value={loading ? "—" : `${((data?.totalFeedstockKg ?? 0) / 1000).toFixed(2)}`}
                            unit="t"
                            sub={loading ? undefined : `${data?.totalFeedstockKg ?? 0} kg total`}
                            loading={loading}
                        />
                        <StatCard
                            label="Last Meter"
                            value={loading ? "—" : data?.lastMeterReading
                                ? data.lastMeterReading.reading.toFixed(1)
                                : "No reading"}
                            unit={data?.lastMeterReading ? "m³" : undefined}
                            sub={loading ? undefined : data?.lastMeterReading
                                ? formatDate(data.lastMeterReading.date.toString())
                                : "Log first reading"}
                            accent={!!data?.lastMeterReading}
                            loading={loading}
                        />
                    </div>

                    {/* ── Today's Checklist ─────────────────────────────────────── */}
                    <div style={{
                        background: C.card,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        padding: "16px 18px",
                    }}>
                        <div style={{
                            fontSize: 12,
                            fontFamily: C.display,
                            fontWeight: 700,
                            color: C.text,
                            marginBottom: 12,
                        }}>
                            Today&apos;s Checklist
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[
                                {
                                    key: "feedstock",
                                    label: "Feedstock Log",
                                    done: data?.todayStatus.feedstockLogged ?? false,
                                    icon: <Package size={14} />,
                                    href: "/feedstock",
                                },
                                {
                                    key: "meter",
                                    label: "Meter Reading",
                                    done: data?.todayStatus.meterLogged ?? false,
                                    icon: <Gauge size={14} />,
                                    href: "/meter",
                                },
                            ].map((item) => (
                                <div
                                    key={item.key}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "10px 12px",
                                        background: loading
                                            ? C.bg
                                            : item.done
                                                ? "#F0F9F4"
                                                : "#FFFBF5",
                                        borderRadius: 10,
                                        border: `1px solid ${loading ? C.border : item.done ? "#C3E6CD" : "#FDE8C8"}`,
                                        cursor: item.done || loading ? "default" : "pointer",
                                        transition: "background 0.15s",
                                    }}
                                    onClick={() => !item.done && !loading && router.push(item.href)}
                                >
                                    <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        background: loading
                                            ? C.border
                                            : item.done
                                                ? "#D1FAE5"
                                                : "#FEF3C7",
                                        color: loading
                                            ? "transparent"
                                            : item.done
                                                ? C.success
                                                : C.accent,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        {!loading && item.icon}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        {loading ? (
                                            <Skeleton height={13} width="60%" />
                                        ) : (
                                            <div style={{
                                                fontSize: 13,
                                                fontFamily: C.sans,
                                                fontWeight: 500,
                                                color: item.done ? C.success : C.text,
                                            }}>
                                                {item.label}
                                            </div>
                                        )}
                                    </div>

                                    {!loading && (
                                        item.done ? (
                                            <CheckCircle size={16} color={C.success} />
                                        ) : (
                                            <ChevronRight size={16} color={C.muted} />
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Recent Activity ───────────────────────────────────────── */}
                    <div style={{
                        background: C.card,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        overflow: "hidden",
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: "14px 18px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: `1px solid ${C.border}`,
                        }}>
                            <div style={{
                                fontSize: 12,
                                fontFamily: C.display,
                                fontWeight: 700,
                                color: C.text,
                            }}>
                                Recent Activity
                            </div>
                            <button
                                onClick={() => router.push("/history")}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    fontSize: 11,
                                    fontFamily: C.mono,
                                    color: C.accent,
                                    fontWeight: 600,
                                    padding: 0,
                                }}
                            >
                                View All
                                <ChevronRight size={13} />
                            </button>
                        </div>

                        {/* Activity list */}
                        <div>
                            {loading ? (
                                // Skeleton rows
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: "12px 18px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
                                        }}
                                    >
                                        <Skeleton width={28} height={28} radius={8} />
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                                            <Skeleton height={12} width="55%" />
                                            <Skeleton height={10} width="35%" />
                                        </div>
                                        <Skeleton height={18} width={50} radius={99} />
                                    </div>
                                ))
                            ) : !data?.recentActivity?.length ? (
                                <div style={{
                                    padding: "32px 18px",
                                    textAlign: "center",
                                    color: C.muted,
                                    fontSize: 13,
                                    fontFamily: C.sans,
                                }}>
                                    <Activity size={28} color={C.border} style={{ marginBottom: 8 }} />
                                    <div>No activity yet.</div>
                                    <div style={{ fontSize: 11, marginTop: 4 }}>
                                        Start by logging feedstock.
                                    </div>
                                </div>
                            ) : (
                                (data.recentActivity as RecentActivityItem[]).map((item, i, arr) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: "12px 18px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                                        }}
                                    >
                                        <ActivityIcon type={item.type} />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 12,
                                                fontFamily: C.sans,
                                                fontWeight: 500,
                                                color: C.text,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}>
                                                {activityTypeLabel[item.type]}
                                                <span style={{
                                                    fontSize: 11,
                                                    color: C.muted,
                                                    fontWeight: 400,
                                                    marginLeft: 5,
                                                }}>
                                                    · {item.summary}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: 10,
                                                fontFamily: C.mono,
                                                color: C.muted,
                                                marginTop: 2,
                                            }}>
                                                {formatDate(item.date)}
                                            </div>
                                        </div>

                                        {/* Sync badge */}
                                        <div style={{
                                            fontSize: 10,
                                            fontFamily: C.mono,
                                            fontWeight: 600,
                                            padding: "3px 8px",
                                            borderRadius: 99,
                                            background: item.synced ? "#F0F9F4" : "#FFF7ED",
                                            color: item.synced ? C.success : C.warning,
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                        }}>
                                            {item.synced ? "Synced" : "Pending"}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Quick Action Row ──────────────────────────────────────── */}
                    <div style={{
                        fontSize: 10,
                        fontFamily: C.mono,
                        color: C.muted,
                        textAlign: "center",
                        letterSpacing: 0.5,
                        paddingTop: 4,
                    }}>
                        {user?.id} · {user?.digesterId ?? "No digester"} ·{" "}
                        <span style={{ color: isOnline ? C.success : C.danger }}>
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </div>

                </div>
            </div>
        </>
    );
}