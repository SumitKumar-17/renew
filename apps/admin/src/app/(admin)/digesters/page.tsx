"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    digestersApi, reportsApi, operatorsApi,
    type Digester, type DigesterDetail, type Operator,
} from "@/lib/api/admin.api";
import {
    Card, Heading, Tag, Btn, Field, TI, AlertBox,
    THead, Paginator, DateFilter, PhotoBtn, PhotoModal,
} from "@/components/ui";
import { C } from "@/lib/utils/tokens";

const PAGE_SIZE = 10;

function fmtDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function todayISO() {
    return new Date().toISOString().split("T")[0];
}

function applyDF<T extends { date: string }>(rows: T[], from: string, to: string): T[] {
    return rows.filter(r => {
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        return true;
    });
}

// ─── Digester Detail View ─────────────────────────────────────────────────────
function DigesterDetailView({
    id,
    onBack,
}: {
    id: string;
    onBack: () => void;
}) {
    const [detail, setDetail] = useState<DigesterDetail | null>(null);
    const [feedstockRows, setFeedstockRows] = useState<any[]>([]);
    const [meterRows, setMeterRows] = useState<any[]>([]);
    const [distRows, setDistRows] = useState<any[]>([]);
    const [compostRows, setCompostRows] = useState<any[]>([]);
    const [tab, setTab] = useState("overview");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [photoModal, setPhotoModal] = useState<{ url: string; caption: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            digestersApi.getById(id),
            reportsApi.getTableData("feedstock"),
            reportsApi.getTableData("meter"),
            reportsApi.getTableData("distribution"),
            reportsApi.getTableData("compost"),
        ]).then(([d, fs, m, dist, c]) => {
            setDetail(d);
            setFeedstockRows(fs.filter((r: any) => r.digesterId === id));
            setMeterRows(m.filter((r: any) => r.digesterId === id));
            setDistRows(dist.filter((r: any) => r.digesterId === id));
            setCompostRows(c.filter((r: any) => r.digesterId === id));
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading || !detail) return <div style={{ padding: 40, color: C.muted }}>Loading…</div>;

    const changeTab = (t: string) => { setTab(t); setFrom(""); setTo(""); setPage(1); };

    const tabData: Record<string, any[]> = {
        feedstock: feedstockRows,
        meter: meterRows,
        distribution: distRows,
        compost: compostRows,
    };
    const filtered = tab === "overview" ? [] : applyDF(tabData[tab] ?? [], from, to);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const { stats } = detail;
    const surplus = stats.totalGasProduced - stats.totalDistributed;
    const anomalies = meterRows.filter((r: any) => r.dailyProduction < 5 && r.dailyProduction != null);

    const TABS = [
        { id: "overview",     label: "Overview" },
        { id: "feedstock",    label: `Feedstock (${feedstockRows.length})` },
        { id: "meter",        label: `Meter (${meterRows.length})` },
        { id: "distribution", label: `Distribution (${distRows.length})` },
        { id: "compost",      label: `Compost (${compostRows.length})` },
    ];

    const tt = { contentStyle: { fontSize: 12, borderRadius: 8 } };
    const ax = { tick: { fontSize: 10, fill: C.muted } };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }} className="fade-in">
            {photoModal && (
                <PhotoModal url={photoModal.url} caption={photoModal.caption} onClose={() => setPhotoModal(null)} />
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button
                    onClick={onBack}
                    style={{
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: "7px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        color: C.muted,
                        fontSize: 13,
                        fontFamily: C.sans,
                        cursor: "pointer",
                    }}
                >
                    <ArrowLeft size={14} /> Back
                </button>
                <Heading size="xl">{detail.id}</Heading>
                <Tag color={detail.status === "active" ? "green" : "gray"}>{detail.status}</Tag>
            </div>

            {/* Header card */}
            <Card style={{ background: C.primary, border: "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
                    {[
                        ["LOCATION", detail.location],
                        ["OPERATOR", detail.operator ? `${detail.operator.name} (${detail.operator.id})` : null],
                        ["INSTALLED", fmtDate(detail.installedDate)],
                        ["HOUSEHOLDS", String(detail.households.length)],
                    ].map(([lbl, val]) => (
                        <div key={lbl!}>
                            <div style={{ fontSize: 10, color: "#9DC0AB", fontFamily: C.mono, letterSpacing: 1.5 }}>{lbl}</div>
                            <div style={{ color: !val ? "#FF9999" : "#fff", fontSize: 13, marginTop: 4, fontWeight: 600 }}>
                                {val ?? "Unassigned"}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                {[
                    { l: "Gas Produced",  v: stats.totalGasProduced.toFixed(1), u: "m³",  c: C.success },
                    { l: "Distributed",   v: stats.totalDistributed.toFixed(1),  u: "m³",  c: C.accent },
                    { l: surplus >= 0 ? "Surplus" : "Deficit", v: Math.abs(surplus).toFixed(1), u: "m³", c: surplus < 0 ? C.danger : C.info },
                    { l: "Feedstock",     v: String(stats.totalFeedstockKg),     u: "kg",  c: "#7C3AED" },
                    { l: "Compost Bags",  v: String(stats.totalCompostBags),              c: "#5B21B6" },
                ].map(s => (
                    <Card key={s.l} style={{ padding: "10px 12px", textAlign: "center" }}>
                        <div style={{ fontFamily: C.mono, fontSize: 18, color: s.c, fontWeight: 600 }}>
                            {s.v}<span style={{ fontSize: 10, color: C.muted }}> {"u" in s ? s.u : ""}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{s.l}</div>
                    </Card>
                ))}
            </div>

            {anomalies.length > 0 && (
                <AlertBox type="warning">{anomalies.length} low-output reading(s) flagged (&lt;5 m³).</AlertBox>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => changeTab(t.id)}
                        style={{
                            padding: "7px 14px",
                            borderRadius: 8,
                            fontSize: 12,
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

            {/* Tab content */}
            {tab !== "overview" && (
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    <DateFilter from={from} setFrom={v => { setFrom(v); setPage(1); }} to={to} setTo={v => { setTo(v); setPage(1); }} />
                    <div style={{ overflow: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: C.sans }}>
                            {tab === "feedstock" && (
                                <>
                                    <THead cols={["Date", "Type", "Weight", "Water (L)", "Photo", "Notes"]} />
                                    <tbody>
                                        {paginated.map((r: any, i: number) => (
                                            <tr key={r.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                                <td style={{ padding: "9px 14px" }}>{fmtDate(r.date)}</td>
                                                <td style={{ padding: "9px 14px" }}>{r.type}</td>
                                                <td style={{ padding: "9px 14px", fontFamily: C.mono }}>{r.weight} kg</td>
                                                <td style={{ padding: "9px 14px", fontFamily: C.mono }}>{r.waterLitres ?? 0} L</td>
                                                <td style={{ padding: "9px 14px" }}>
                                                    <PhotoBtn url={r.photoUrl} caption={`${r.type} · ${fmtDate(r.date)}`} setModal={setPhotoModal} />
                                                </td>
                                                <td style={{ padding: "9px 14px", color: C.muted }}>{r.notes || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                            {tab === "meter" && (
                                <>
                                    <THead cols={["Date", "Meter Reading", "Photo", "Notes"]} />
                                    <tbody>
                                        {paginated.map((r: any, i: number) => (
                                            <tr key={r.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                                <td style={{ padding: "9px 14px" }}>{fmtDate(r.date)}</td>
                                                <td style={{ padding: "9px 14px", fontFamily: C.mono, fontWeight: 700 }}>{r.reading} m³</td>
                                                <td style={{ padding: "9px 14px" }}>
                                                    <PhotoBtn url={r.photoUrl} caption={`Meter · ${fmtDate(r.date)}`} setModal={setPhotoModal} />
                                                </td>
                                                <td style={{ padding: "9px 14px", color: C.muted }}>{r.notes || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                            {tab === "distribution" && (
                                <>
                                    <THead cols={["Date", "Household", "Volume"]} />
                                    <tbody>
                                        {paginated.map((r: any, i: number) => (
                                            <tr key={r.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                                <td style={{ padding: "9px 14px" }}>{fmtDate(r.date)}</td>
                                                <td style={{ padding: "9px 14px" }}>{r.householdHead}</td>
                                                <td style={{ padding: "9px 14px", fontFamily: C.mono }}>{r.volume} m³</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                            {tab === "compost" && (
                                <>
                                    <THead cols={["Date", "Bags", "Photo", "Notes"]} />
                                    <tbody>
                                        {paginated.map((r: any, i: number) => (
                                            <tr key={r.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                                <td style={{ padding: "9px 14px" }}>{fmtDate(r.date)}</td>
                                                <td style={{ padding: "9px 14px", fontFamily: C.mono, fontWeight: 700, color: "#7C3AED" }}>{r.bags}</td>
                                                <td style={{ padding: "9px 14px" }}>
                                                    <PhotoBtn url={r.photoUrl} caption={`Compost · ${fmtDate(r.date)}`} setModal={setPhotoModal} />
                                                </td>
                                                <td style={{ padding: "9px 14px", color: C.muted }}>{r.notes || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>
                    <Paginator page={safePage} totalPages={totalPages} setPage={setPage} total={filtered.length} />
                </Card>
            )}
        </div>
    );
}

// ─── Digesters List Page ──────────────────────────────────────────────────────
export default function DigestersPage() {
    const [digesters, setDigesters] = useState<Digester[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ id: "", location: "", installedDate: todayISO() });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        Promise.all([digestersApi.getAll(), operatorsApi.getAll()])
            .then(([d, o]) => { setDigesters(d); setOperators(o); })
            .finally(() => setLoading(false));
    }, []);

    if (detail) {
        return <DigesterDetailView id={detail} onBack={() => setDetail(null)} />;
    }

    const totalPages = Math.max(1, Math.ceil(digesters.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = digesters.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleAdd = async () => {
        if (!form.id || !form.location || !form.installedDate) {
            setFormError("All fields are required");
            return;
        }
        setSubmitting(true);
        setFormError("");
        try {
            const created = await digestersApi.create(form);
            setDigesters(prev => [...prev, {
                ...created,
                operator: null,
                householdCount: 0,
                installedDate: form.installedDate,
            }]);
            setForm({ id: "", location: "", installedDate: todayISO() });
            setShowAdd(false);
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? "Failed to create digester");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ color: C.muted, padding: 40 }}>Loading…</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Heading size="xl">Digesters</Heading>
                <Btn icon={Plus} onClick={() => setShowAdd(true)}>Add Digester</Btn>
            </div>

            {showAdd && (
                <Card style={{ border: `2px solid ${C.primary}` }} className="fade-in">
                    <Heading size="md" style={{ marginBottom: 16 }}>Register New Digester</Heading>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Digester ID" required note="e.g. DG-007">
                            <TI value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.toUpperCase() }))} placeholder="DG-XXX" />
                        </Field>
                        <Field label="Installation Date" required>
                            <TI type="date" value={form.installedDate} onChange={e => setForm(f => ({ ...f, installedDate: e.target.value }))} />
                        </Field>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <Field label="Location / Address" required>
                                <TI value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Village, Ward, Block..." />
                            </Field>
                        </div>
                    </div>
                    {formError && <div style={{ marginTop: 10, color: C.danger, fontSize: 13 }}>{formError}</div>}
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        <Btn onClick={handleAdd} disabled={submitting}>{submitting ? "Registering…" : "Register"}</Btn>
                        <Btn variant="secondary" onClick={() => { setShowAdd(false); setFormError(""); }}>Cancel</Btn>
                    </div>
                </Card>
            )}

            <Card style={{ padding: 0, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: C.sans }}>
                    <THead cols={["Digester", "Location", "Installed", "Operator", "HH", "Status"]} />
                    <tbody>
                        {paginated.map((d, i) => (
                            <tr
                                key={d.id}
                                onClick={() => setDetail(d.id)}
                                style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                                onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                                onMouseLeave={e => (e.currentTarget.style.background = "")}
                            >
                                <td style={{ padding: "12px 14px", fontFamily: C.mono, fontWeight: 700, color: C.primary }}>{d.id}</td>
                                <td style={{ padding: "12px 14px" }}>{d.location}</td>
                                <td style={{ padding: "12px 14px", color: C.muted }}>{fmtDate(d.installedDate)}</td>
                                <td style={{ padding: "12px 14px" }}>
                                    {d.operator
                                        ? <Tag color="green">{d.operator.id}</Tag>
                                        : <Tag color="red">Unassigned</Tag>
                                    }
                                </td>
                                <td style={{ padding: "12px 14px", textAlign: "center" }}>{d.householdCount}</td>
                                <td style={{ padding: "12px 14px" }}>
                                    <Tag color={d.status === "active" ? "green" : "gray"}>{d.status}</Tag>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Paginator page={safePage} totalPages={totalPages} setPage={setPage} total={digesters.length} />
            </Card>
        </div>
    );
}
