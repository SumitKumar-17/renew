"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { reportsApi, operatorsApi, type Operator } from "@/lib/api/admin.api";
import { Card, Heading, Tag, THead, Paginator, DateFilter, PhotoBtn, PhotoModal } from "@/components/ui";
import { C } from "@/lib/utils/tokens";

const PAGE_SIZE = 10;

function fmtDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

interface CompostRow {
    id: string;
    date: string;
    digesterId: string;
    location: string;
    operatorId: string;
    bags: number;
    photoUrl: string | null;
    notes: string | null;
}

export default function CompostPage() {
    const [logs, setLogs] = useState<CompostRow[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [trend, setTrend] = useState<Array<{ date: string; bags: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [photoModal, setPhotoModal] = useState<{ url: string; caption: string } | null>(null);

    useEffect(() => {
        Promise.all([
            reportsApi.getTableData("compost"),
            operatorsApi.getAll(),
            reportsApi.getCharts(),
        ]).then(([cl, ops, charts]) => {
            setLogs(cl);
            setOperators(ops);
            setTrend(charts.compostTrend);
        }).finally(() => setLoading(false));
    }, []);

    const filtered = logs.filter(r => {
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const totalBags = logs.reduce((s, r) => s + r.bags, 0);
    const activeDigesters = new Set(logs.map(r => r.digesterId)).size;

    const tt = { contentStyle: { fontSize: 12, borderRadius: 8 } };

    if (loading) return <div style={{ color: C.muted, padding: 40 }}>Loading…</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
            {photoModal && (
                <PhotoModal url={photoModal.url} caption={photoModal.caption} onClose={() => setPhotoModal(null)} />
            )}

            <div>
                <Heading size="xl">Compost Logs</Heading>
                <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Digestate compost bags across all digesters</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {[
                    { l: "Total Bags",       v: totalBags,       c: "#7C3AED" },
                    { l: "Active Digesters", v: activeDigesters, c: C.success },
                    { l: "Total Logs",       v: logs.length,     c: C.info },
                ].map(s => (
                    <Card key={s.l} style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{s.l}</div>
                        <div style={{ fontFamily: C.mono, fontSize: 26, color: s.c, fontWeight: 600 }}>{s.v}</div>
                    </Card>
                ))}
            </div>

            {/* Trend chart */}
            <Card>
                <Heading size="sm" style={{ marginBottom: 14 }}>Compost Bags — Last 14 Days (All Digesters)</Heading>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} interval={1} />
                        <YAxis tick={{ fontSize: 10, fill: C.muted }} unit=" bags" />
                        <Tooltip {...tt} />
                        <Bar dataKey="bags" fill="#7C3AED" name="Bags" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Table */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
                <DateFilter
                    from={from} setFrom={v => { setFrom(v); setPage(1); }}
                    to={to}   setTo={v => { setTo(v);   setPage(1); }}
                />
                <div style={{ overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <THead cols={["Date", "Digester", "Operator", "Bags", "Photo", "Notes"]} />
                        <tbody>
                            {paginated.map((r, i) => {
                                const op = operators.find(o => o.id === r.operatorId);
                                return (
                                    <tr key={r.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                        <td style={{ padding: "10px 14px" }}>{fmtDate(r.date)}</td>
                                        <td style={{ padding: "10px 14px", fontFamily: C.mono, fontWeight: 700, color: C.primary }}>{r.digesterId}</td>
                                        <td style={{ padding: "10px 14px" }}>{op?.name ?? r.operatorId}</td>
                                        <td style={{ padding: "10px 14px", fontFamily: C.mono, fontWeight: 700, color: "#7C3AED" }}>{r.bags}</td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <PhotoBtn url={r.photoUrl} caption={`Compost · ${r.digesterId} · ${fmtDate(r.date)}`} setModal={setPhotoModal} />
                                        </td>
                                        <td style={{ padding: "10px 14px", color: C.muted }}>{r.notes || "—"}</td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.muted }}>
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Paginator page={safePage} totalPages={totalPages} setPage={setPage} total={filtered.length} />
            </Card>
        </div>
    );
}
