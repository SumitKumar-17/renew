"use client";

import { useEffect, useState } from "react";
import {
    Database,
    Users,
    Home,
    Gauge,
    Leaf,
    Package,
    Fuel,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { reportsApi, type OverviewData, type ChartsData } from "@/lib/api/admin.api";
import { Card, Heading, AlertBox } from "@/components/ui";
import { C, PIE_C } from "@/lib/utils/tokens";

export default function OverviewPage() {
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [charts, setCharts] = useState<ChartsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([reportsApi.getOverview(), reportsApi.getCharts()])
            .then(([ov, ch]) => {
                setOverview(ov);
                setCharts(ch);
            })
            .catch(() => setError("Failed to load dashboard data"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (error) return <AlertBox type="error">{error}</AlertBox>;
    if (!overview || !charts) return null;

    const { stats, fuelDisplacement } = overview;
    const surplus = stats.surplus;

    const statCards = [
        { l: "Digesters",     v: stats.digesterCount,          c: C.primary,  I: Database },
        { l: "Operators",     v: stats.operatorCount,          c: C.info,     I: Users },
        { l: "Households",    v: stats.householdCount,         c: C.success,  I: Home },
        { l: "Gas Produced",  v: stats.totalGasProduced.toFixed(1), u: "m³", c: C.accent, I: Gauge },
        { l: "Feedstock",     v: stats.totalFeedstockKg,       u: "kg", c: "#7C3AED", I: Leaf },
        { l: "Compost Bags",  v: stats.totalCompostBags,       c: "#5B21B6",  I: Package },
    ];

    const tt = { contentStyle: { fontSize: 12, fontFamily: C.sans, borderRadius: 8 } };
    const ax = { tick: { fontSize: 10, fill: C.muted } };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="fade-in">
            <div>
                <Heading size="xl">Overview</Heading>
                <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>
                    Renew Hope Initiative — All Digesters
                </p>
            </div>

            {/* Alerts */}
            {(surplus < 0 || stats.anomalyCount > 0 || stats.unassignedDigesters > 0) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {surplus < 0 && (
                        <AlertBox type="error">
                            Gas distributed ({stats.totalDistributed.toFixed(1)} m³) exceeds produced ({stats.totalGasProduced.toFixed(1)} m³). Deficit: {Math.abs(surplus).toFixed(1)} m³.
                        </AlertBox>
                    )}
                    {stats.anomalyCount > 0 && (
                        <AlertBox type="warning">
                            {stats.anomalyCount} log(s) flagged for low output (&lt;5 m³/day).
                        </AlertBox>
                    )}
                    {stats.unassignedDigesters > 0 && (
                        <AlertBox type="error">
                            {stats.unassignedDigesters} digester(s) unassigned.
                        </AlertBox>
                    )}
                </div>
            )}

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {statCards.map(s => (
                    <Card key={s.l} style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.l}</span>
                            <div style={{ background: s.c + "18", borderRadius: 6, padding: 5 }}>
                                <s.I size={14} color={s.c} />
                            </div>
                        </div>
                        <div style={{ fontFamily: C.mono, fontSize: 24, color: C.text }}>
                            {s.v}<span style={{ fontSize: 12, color: C.muted }}> {"u" in s ? s.u : ""}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            {/* Gas Trend */}
            <Card>
                <Heading size="sm" style={{ marginBottom: 14 }}>Gas Production — Last 14 Days (m³/day)</Heading>
                <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={charts.gasTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis dataKey="date" {...ax} interval={1} />
                        <YAxis {...ax} unit=" m³" />
                        <Tooltip {...tt} />
                        <Line type="monotone" dataKey="volume" stroke={C.accent} strokeWidth={2.5} dot={{ r: 4, fill: C.accent }} name="Gas (m³)" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* 2-col charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Gas Balance by Digester */}
                <Card>
                    <Heading size="sm" style={{ marginBottom: 14 }}>Gas Balance by Digester</Heading>
                    <ResponsiveContainer width="100%" height={190}>
                        <BarChart data={charts.gasBalance} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                            <XAxis dataKey="id" {...ax} />
                            <YAxis {...ax} unit=" m³" />
                            <Tooltip {...tt} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="produced" fill={C.success} name="Produced" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="distributed" fill={C.accent} name="Distributed" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Feedstock by Type */}
                <Card>
                    <Heading size="sm" style={{ marginBottom: 14 }}>Feedstock by Type (kg)</Heading>
                    {charts.feedstockByType.length === 0 ? (
                        <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>No data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={190}>
                            <PieChart>
                                <Pie data={charts.feedstockByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={30}>
                                    {charts.feedstockByType.map((_, i) => <Cell key={i} fill={PIE_C[i % 6]} />)}
                                </Pie>
                                <Tooltip {...tt} />
                                <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                {/* Feedstock Trend */}
                <Card>
                    <Heading size="sm" style={{ marginBottom: 14 }}>Feedstock Input — Last 14 Days (kg/day)</Heading>
                    <ResponsiveContainer width="100%" height={190}>
                        <BarChart data={charts.fsTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                            <XAxis dataKey="date" {...ax} interval={1} />
                            <YAxis {...ax} unit=" kg" />
                            <Tooltip {...tt} />
                            <Bar dataKey="kg" fill={C.success} name="Feedstock (kg)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Compost by Digester */}
                <Card>
                    <Heading size="sm" style={{ marginBottom: 14 }}>Total Compost Bags by Digester</Heading>
                    <ResponsiveContainer width="100%" height={190}>
                        <BarChart data={charts.compostByDigester} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                            <XAxis dataKey="id" {...ax} />
                            <YAxis {...ax} unit=" bags" />
                            <Tooltip {...tt} />
                            <Bar dataKey="bags" fill="#7C3AED" name="Bags" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Compost trend */}
            <Card>
                <Heading size="sm" style={{ marginBottom: 14 }}>Compost Bags — Last 14 Days</Heading>
                <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={charts.compostTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis dataKey="date" {...ax} interval={1} />
                        <YAxis {...ax} unit=" bags" />
                        <Tooltip {...tt} />
                        <Bar dataKey="bags" fill="#7C3AED" name="Bags" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Fuel Displacement */}
            {Object.keys(fuelDisplacement).length > 0 && (
                <Card>
                    <Heading size="sm" style={{ marginBottom: 14 }}>Fuel Displacement</Heading>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {Object.entries(fuelDisplacement).map(([f, c]) => (
                            <div
                                key={f}
                                style={{
                                    padding: "8px 14px",
                                    background: C.bg,
                                    borderRadius: 8,
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                }}
                            >
                                <Fuel size={13} color={C.accent} />
                                <span style={{ fontSize: 13 }}>{f}</span>
                                <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.primary }}>{c} HH</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

function LoadingSkeleton() {
    const shimmer: React.CSSProperties = {
        background: "linear-gradient(90deg, #E4DFD5 25%, #F4F0E8 50%, #E4DFD5 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        borderRadius: 8,
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ ...shimmer, width: 200, height: 32 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {[1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                        <div style={{ ...shimmer, width: 80, height: 10, marginBottom: 10 }} />
                        <div style={{ ...shimmer, width: 60, height: 28 }} />
                    </div>
                ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                <div style={{ ...shimmer, width: 200, height: 12, marginBottom: 14 }} />
                <div style={{ ...shimmer, width: "100%", height: 190 }} />
            </div>
        </div>
    );
}
