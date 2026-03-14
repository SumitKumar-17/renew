"use client";

import { useState, useEffect, useMemo } from "react";
import { Btn, Field, TI, Card, Heading, Tag, Paginator } from "@/components/ui";
import { feedstockApi } from "@/lib/api/feedstock.api";
import { meterApi } from "@/lib/api/meter.api";
import { distributionApi } from "@/lib/api/distribution.api";
import { compostApi } from "@/lib/api/compost.api";
import { C } from "@/lib/utils/tokens";
import { shortId } from "@/lib/utils/shortId";

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = "feedstock" | "meter" | "distribution" | "compost";

interface AllData {
    feedstock: any[];
    meter: any[];
    distribution: any[];
    compost: any[];
}

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
    const raw = typeof d === "string" ? d.split("T")[0] : d;
    return new Date(raw + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function applyDateFilter(items: any[], from: string, to: string) {
    return items.filter(r => {
        const d = typeof r.date === "string" ? r.date.split("T")[0] : r.date;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
    });
}

// ─── Row renderers ────────────────────────────────────────────────────────────
function FeedstockRow({ r }: { r: any }) {
    return (
        <>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: C.sans }}>{r.type}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {fmtDate(r.date)} · {r.weight} kg · {r.waterLitres ?? 0} L water
                    {r.notes ? ` · ${r.notes}` : ""}
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                <Tag color={r.synced ? "green" : "amber"}>{r.synced ? "Synced" : "Pending"}</Tag>
                {(r.hasPhoto || r.photoUrl) && <Tag color="blue">📷 Photo</Tag>}
            </div>
        </>
    );
}

function MeterRow({ r }: { r: any }) {
    return (
        <>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: C.sans }}>
                    Meter: {r.reading} m³
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {fmtDate(r.date)}{r.notes ? ` · ${r.notes}` : ""}
                </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {r.photoUrl && <Tag color="blue">📷 Photo</Tag>}
                <Tag color={r.synced ? "green" : "amber"}>{r.synced ? "Synced" : "Pending"}</Tag>
            </div>
        </>
    );
}

function DistributionRow({ r }: { r: any }) {
    const name = r.householdName ?? r.household?.headName ?? "—";
    const hhId = r.householdId ? shortId(r.householdId) : "—";
    return (
        <>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: C.sans }}>
                    {name}{" "}
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>({hhId})</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {fmtDate(r.date)} · {r.volume} m³
                </div>
            </div>
            <Tag color={r.synced ? "green" : "amber"}>{r.synced ? "Synced" : "Pending"}</Tag>
        </>
    );
}

function CompostRow({ r }: { r: any }) {
    return (
        <>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: C.sans }}>{r.bags} bags</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {fmtDate(r.date)}{r.notes ? ` · ${r.notes}` : ""}
                </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {r.photoUrl && <Tag color="blue">📷 Photo</Tag>}
                <Tag color={r.synced ? "green" : "amber"}>{r.synced ? "Synced" : "Pending"}</Tag>
            </div>
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HistoryPage() {
    const [tab, setTab] = useState<TabId>("feedstock");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AllData>({
        feedstock: [],
        meter: [],
        distribution: [],
        compost: [],
    });

    // ── Load all data on mount ────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            feedstockApi.getAll(),
            meterApi.getAll(),
            distributionApi.getAll(),
            compostApi.getAll(),
        ])
            .then(([feedstock, meter, distribution, compost]) => {
                // normalise dates and sort descending
                const norm = (arr: any[]) =>
                    [...arr]
                        .map(r => ({ ...r, date: typeof r.date === "string" ? r.date.split("T")[0] : r.date }))
                        .sort((a, b) => b.date.localeCompare(a.date));
                setData({
                    feedstock: norm(feedstock),
                    meter: norm(meter),
                    distribution: norm(distribution),
                    compost: norm(compost),
                });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // ── Derived ───────────────────────────────────────────────────────────────
    const filtered = useMemo(
        () => applyDateFilter(data[tab], from, to),
        [data, tab, from, to]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    function changeTab(t: TabId) {
        setTab(t);
        setFrom("");
        setTo("");
        setPage(1);
    }

    const TABS: { id: TabId; label: string }[] = [
        { id: "feedstock", label: `Feedstock (${data.feedstock.length})` },
        { id: "meter", label: `Meter (${data.meter.length})` },
        { id: "distribution", label: `Distrib. (${data.distribution.length})` },
        { id: "compost", label: `Compost (${data.compost.length})` },
    ];

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        const shimmer: React.CSSProperties = {
            background: "linear-gradient(90deg, #E4DFD5 25%, #F4F0E8 50%, #E4DFD5 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
            borderRadius: 8,
        };
        return (
            <>
                <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ ...shimmer, width: 180, height: 28 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ ...shimmer, width: 90, height: 32, borderRadius: 8 }} />
                        ))}
                    </div>
                    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                        {[1, 2, 3, 4, 5].map((i, idx, arr) => (
                            <div key={i} style={{ padding: "12px 14px", borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ ...shimmer, width: 140, height: 14, marginBottom: 6 }} />
                                    <div style={{ ...shimmer, width: 220, height: 11 }} />
                                </div>
                                <div style={{ ...shimmer, width: 60, height: 22, borderRadius: 4 }} />
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    // ── Main ──────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Heading size="xl">Activity History</Heading>

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => changeTab(t.id)}
                        style={{
                            padding: "7px 12px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: C.sans,
                            cursor: "pointer",
                            border: "none",
                            background: tab === t.id ? C.primary : C.border,
                            color: tab === t.id ? "#fff" : C.muted,
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Date filter + list */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
                {/* Date filter bar */}
                <div
                    style={{
                        padding: "10px 14px",
                        background: C.bg,
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                    }}
                >
                    <div style={{ minWidth: 130 }}>
                        <Field label="From">
                            <TI
                                type="date"
                                value={from}
                                onChange={e => { setFrom(e.target.value); setPage(1); }}
                            />
                        </Field>
                    </div>
                    <div style={{ minWidth: 130 }}>
                        <Field label="To">
                            <TI
                                type="date"
                                value={to}
                                onChange={e => { setTo(e.target.value); setPage(1); }}
                            />
                        </Field>
                    </div>
                    {(from || to) && (
                        <Btn
                            size="sm"
                            variant="ghost"
                            onClick={() => { setFrom(""); setTo(""); setPage(1); }}
                        >
                            Clear ✕
                        </Btn>
                    )}
                </div>

                {/* Row list */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {paginated.length === 0 ? (
                        <div style={{ textAlign: "center", color: C.muted, padding: 40, fontFamily: C.sans, fontSize: 13 }}>
                            No entries found.
                        </div>
                    ) : (
                        paginated.map((r, i) => (
                            <div
                                key={r.id ?? i}
                                style={{
                                    padding: "12px 14px",
                                    borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: 10,
                                }}
                            >
                                {tab === "feedstock" && <FeedstockRow r={r} />}
                                {tab === "meter" && <MeterRow r={r} />}
                                {tab === "distribution" && <DistributionRow r={r} />}
                                {tab === "compost" && <CompostRow r={r} />}
                            </div>
                        ))
                    )}
                </div>

                <Paginator
                    page={safePage}
                    totalPages={totalPages}
                    setPage={setPage}
                    total={filtered.length}
                />
            </Card>
        </div>
    );
}
