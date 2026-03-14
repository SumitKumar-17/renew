"use client";

import { useEffect, useState } from "react";
import {
    BarChart3, Activity, Leaf, Share2, Package, Home, Users, Download,
} from "lucide-react";
import {
    reportsApi, digestersApi, operatorsApi, householdsApi,
    type Digester, type Operator,
} from "@/lib/api/admin.api";
import { Card, Heading, Field, TI, Btn } from "@/components/ui";
import { C } from "@/lib/utils/tokens";

interface Household {
    id: string;
    headName: string;
    phone: string;
    address: string | null;
    members: number;
    fuelReplaced: string[];
    joinedAt: string;
    digesterId: string;
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return;
    const cols = Object.keys(data[0]);
    const rows = data.map(row =>
        cols.map(c => {
            const v = row[c];
            const s = v == null ? "" : String(v);
            return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(",")
    );
    const csv = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function applyDF<T extends { date: string }>(rows: T[], from: string, to: string): T[] {
    return rows.filter(r => {
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        return true;
    });
}

export default function ExportPage() {
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [digesters, setDigesters] = useState<Digester[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [households, setHouseholds] = useState<Household[]>([]);
    const [feedstock, setFeedstock] = useState<any[]>([]);
    const [meter, setMeter] = useState<any[]>([]);
    const [distribution, setDistribution] = useState<any[]>([]);
    const [compost, setCompost] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([
            digestersApi.getAll(),
            operatorsApi.getAll(),
            householdsApi.getAll(),
            reportsApi.getTableData("feedstock"),
            reportsApi.getTableData("meter"),
            reportsApi.getTableData("distribution"),
            reportsApi.getTableData("compost"),
        ]).then(([d, o, hh, fs, m, dist, c]) => {
            setDigesters(d);
            setOperators(o);
            setHouseholds(hh);
            setFeedstock(fs);
            setMeter(m);
            setDistribution(dist);
            setCompost(c);
        }).finally(() => setLoading(false));
    }, []);

    const fs = applyDF(feedstock, from, to);
    const mt = applyDF(meter, from, to);
    const dist = applyDF(distribution, from, to);
    const cl = applyDF(compost, from, to);

    // Build export datasets
    const mkSummary = () => digesters.map(d => {
        const op = operators.find(o => o.digesterId === d.id);
        const dHH = households.filter(h => h.digesterId === d.id);
        const dFS = applyDF(feedstock.filter(r => r.digesterId === d.id), from, to);
        const dMT = applyDF(meter.filter(r => r.digesterId === d.id), from, to);
        const dDist = applyDF(distribution.filter(r => r.digesterId === d.id), from, to);
        const dCL = applyDF(compost.filter(r => r.digesterId === d.id), from, to);
        const gasProduced = dMT.length >= 2
            ? +(dMT[dMT.length - 1].reading - dMT[0].reading).toFixed(2)
            : 0;
        return {
            digester_id: d.id,
            location: d.location,
            status: d.status,
            installed: d.installedDate,
            operator_id: op?.id ?? "",
            operator_name: op?.name ?? "",
            households: dHH.length,
            total_members: dHH.reduce((s, h) => s + h.members, 0),
            feedstock_entries: dFS.length,
            feedstock_kg: dFS.reduce((s, r) => s + r.weight, 0),
            water_litres: dFS.reduce((s, r) => s + (r.waterLitres || 0), 0),
            gas_produced_m3: gasProduced,
            gas_distributed_m3: +dDist.reduce((s, r) => s + r.volume, 0).toFixed(2),
            compost_bags: dCL.reduce((s, r) => s + r.bags, 0),
        };
    });

    const mkGas = () => mt.map(r => {
        const op = operators.find(o => o.id === r.operatorId);
        return {
            date: r.date,
            digester_id: r.digesterId,
            location: r.location,
            meter_reading_m3: r.reading,
            operator_id: r.operatorId,
            operator_name: op?.name ?? "",
            notes: r.notes ?? "",
        };
    });

    const mkFeedstock = () => fs.map(r => {
        const op = operators.find(o => o.id === r.operatorId);
        return {
            date: r.date,
            digester_id: r.digesterId,
            location: r.location,
            operator_name: op?.name ?? "",
            feedstock_type: r.type,
            weight_kg: r.weight,
            water_litres: r.waterLitres ?? 0,
            has_photo: r.photoUrl ? "Yes" : "No",
            notes: r.notes ?? "",
        };
    });

    const mkDist = () => dist.map(r => {
        const op = operators.find(o => o.id === r.operatorId);
        const hh = households.find(h => h.id === r.householdId);
        return {
            date: r.date,
            digester_id: r.digesterId,
            location: r.location,
            operator_name: op?.name ?? "",
            household_id: r.householdId,
            household_head: r.householdHead,
            phone: hh?.phone ?? "",
            members: hh?.members ?? "",
            fuel_replaced: (hh?.fuelReplaced ?? []).join("; "),
            volume_m3: r.volume,
        };
    });

    const mkCompost = () => cl.map(r => {
        const op = operators.find(o => o.id === r.operatorId);
        return {
            date: r.date,
            digester_id: r.digesterId,
            location: r.location,
            operator_name: op?.name ?? "",
            bags: r.bags,
            notes: r.notes ?? "",
        };
    });

    const mkHouseholds = () => households.map(h => {
        const d = digesters.find(x => x.id === h.digesterId);
        const op = operators.find(o => o.digesterId === h.digesterId);
        return {
            household_id: h.id,
            head_name: h.headName,
            phone: h.phone,
            address: h.address ?? "",
            members: h.members,
            digester_id: h.digesterId,
            location: d?.location ?? "",
            operator_name: op?.name ?? "",
            fuel_replaced: (h.fuelReplaced ?? []).join("; "),
            joined_date: h.joinedAt.slice(0, 10),
        };
    });

    const mkOperators = () => operators.map(op => ({
        operator_id: op.id,
        name: op.name,
        phone: op.phone,
        status: op.status,
        digester_id: op.digesterId ?? "",
        digester_location: op.digesterLocation ?? "",
        joined: op.createdAt,
    }));

    const EXPORTS = [
        { id: "summary",    l: "Programme Summary",   mk: mkSummary,    file: "programme_summary.csv",   c: C.primary,  I: BarChart3, note: "One row per digester — aggregated totals for filtered period",            count: digesters.length,       unit: "digesters" },
        { id: "gas",        l: "Daily Gas Production", mk: mkGas,        file: "daily_gas_production.csv",c: C.accent,   I: Activity,  note: "Meter readings with operator name — suitable for MRV submission",        count: mt.length,             unit: "readings" },
        { id: "feedstock",  l: "Feedstock Logs",       mk: mkFeedstock,  file: "feedstock_logs.csv",      c: C.success,  I: Leaf,      note: "All inputs with operator name, digester location, water added",           count: fs.length,             unit: "entries" },
        { id: "dist",       l: "Gas Distribution",     mk: mkDist,       file: "gas_distribution.csv",    c: C.info,     I: Share2,    note: "Household delivery records enriched with contact info and fuel displaced",count: dist.length,           unit: "records" },
        { id: "compost",    l: "Compost Logs",         mk: mkCompost,    file: "compost_logs.csv",        c: "#7C3AED",  I: Package,   note: "Daily bag counts per digester with operator name",                        count: cl.length,             unit: "entries" },
        { id: "hh",         l: "Household Roster",     mk: mkHouseholds, file: "household_roster.csv",    c: "#5B21B6",  I: Home,      note: "All households with digester, operator and fuel displacement detail",     count: households.length,     unit: "households" },
        { id: "ops",        l: "Operator Roster",      mk: mkOperators,  file: "operators.csv",           c: C.warning,  I: Users,     note: "Operator IDs, contacts and digester assignments — passwords excluded",   count: operators.length,      unit: "operators" },
    ];

    if (loading) return <div style={{ color: C.muted, padding: 40 }}>Loading…</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="fade-in">
            <div>
                <Heading size="xl">Export Data</Heading>
                <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>
                    All transaction exports are enriched — operator names, locations and household details joined in.
                </p>
            </div>

            {/* Date filter */}
            <Card>
                <Heading size="sm" style={{ marginBottom: 10 }}>Date Range Filter</Heading>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
                    Applies to Gas Production, Feedstock, Distribution and Compost exports.
                    Programme Summary aggregates within the same range.
                    Rosters (Households, Operators) always export all records.
                </p>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 160 }}>
                        <Field label="From">
                            <TI type="date" value={from} onChange={e => setFrom(e.target.value)} />
                        </Field>
                    </div>
                    <div style={{ minWidth: 160 }}>
                        <Field label="To">
                            <TI type="date" value={to} onChange={e => setTo(e.target.value)} />
                        </Field>
                    </div>
                    {(from || to) && (
                        <Btn size="sm" variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Clear ✕</Btn>
                    )}
                </div>
                {(from || to) && (
                    <div style={{ marginTop: 10, fontSize: 12, color: C.info, fontFamily: C.mono }}>
                        Filtering: {from || "start"} → {to || "present"}
                    </div>
                )}
            </Card>

            {/* Export cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {EXPORTS.map(ex => {
                    const data = ex.mk();
                    const cols = data.length > 0 ? Object.keys(data[0]) : [];
                    return (
                        <Card key={ex.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 0 }}>
                                    <div style={{ background: ex.c + "18", borderRadius: 10, padding: 12, flexShrink: 0 }}>
                                        <ex.I size={20} color={ex.c} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{ex.l}</div>
                                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
                                            {ex.count} {ex.unit} · {ex.note}
                                        </div>
                                        {cols.length > 0 && (
                                            <div style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, background: C.bg, padding: "4px 8px", borderRadius: 5, wordBreak: "break-all", lineHeight: 1.6 }}>
                                                Columns: {cols.join(" · ")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Btn
                                    size="sm"
                                    icon={Download}
                                    onClick={() => downloadCSV(data, ex.file)}
                                    disabled={data.length === 0}
                                >
                                    Export
                                </Btn>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
