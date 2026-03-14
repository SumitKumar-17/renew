"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { householdsApi, digestersApi, operatorsApi, type Digester, type Operator } from "@/lib/api/admin.api";
import { Card, Heading, Tag, Btn, Field, TI, SI, FuelMultiSelect, THead, Paginator } from "@/components/ui";
import { C } from "@/lib/utils/tokens";

const PAGE_SIZE = 10;

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

function fmtDate(d: string) {
    return new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

export default function HouseholdsPage() {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [digesters, setDigesters] = useState<Digester[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const [sel, setSel] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ headName: "", phone: "", address: "", members: "", fuelReplaced: [] as string[] });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        Promise.all([householdsApi.getAll(), digestersApi.getAll(), operatorsApi.getAll()])
            .then(([hh, digs, ops]) => {
                setHouseholds(hh);
                setDigesters(digs);
                setOperators(ops);
                if (digs.length > 0) setSel(digs[0].id);
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = households.filter(h => h.digesterId === sel);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const digOp = operators.find(op => op.digesterId === sel);

    const handleAdd = async () => {
        if (!form.headName || !form.phone) {
            setFormError("Head name and phone are required");
            return;
        }
        setSubmitting(true);
        setFormError("");
        try {
            const created = await householdsApi.create({
                headName: form.headName,
                phone: form.phone,
                address: form.address || undefined,
                members: parseInt(form.members) || 0,
                fuelReplaced: form.fuelReplaced,
                digesterId: sel,
            });
            setHouseholds(prev => [...prev, {
                ...created,
                joinedAt: created.joinedAt ?? new Date().toISOString(),
            }]);
            setForm({ headName: "", phone: "", address: "", members: "", fuelReplaced: [] });
            setShowAdd(false);
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? "Failed to add household");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ color: C.muted, padding: 40 }}>Loading…</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Heading size="xl">Households</Heading>
                <Btn icon={Plus} onClick={() => setShowAdd(true)} disabled={!sel}>Add HH</Btn>
            </div>

            {/* Digester selector */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ minWidth: 280 }}>
                    <Field label="Select Digester">
                        <SI
                            value={sel}
                            onChange={e => { setSel(e.target.value); setPage(1); }}
                            options={digesters.map(d => ({ value: d.id, label: `${d.id} – ${d.location}` }))}
                        />
                    </Field>
                </div>
                {digOp && (
                    <div style={{ fontSize: 13, color: C.muted }}>
                        Operator: <strong style={{ color: C.text }}>{digOp.name}</strong>
                    </div>
                )}
            </div>

            {showAdd && (
                <Card style={{ border: `2px solid ${C.primary}` }} className="fade-in">
                    <Heading size="md" style={{ marginBottom: 16 }}>Add Household to {sel}</Heading>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Head of Household" required>
                            <TI value={form.headName} onChange={e => setForm(f => ({ ...f, headName: e.target.value }))} placeholder="Full name" />
                        </Field>
                        <Field label="Phone" required>
                            <TI value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} type="tel" placeholder="10-digit" />
                        </Field>
                        <Field label="Address">
                            <TI value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="House / Plot / Lane" />
                        </Field>
                        <Field label="Members">
                            <TI value={form.members} onChange={e => setForm(f => ({ ...f, members: e.target.value }))} type="number" placeholder="e.g. 4" />
                        </Field>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <Field label="Fuels Being Replaced" note="Select all that apply">
                                <FuelMultiSelect
                                    value={form.fuelReplaced}
                                    onChange={v => setForm(f => ({ ...f, fuelReplaced: v }))}
                                />
                            </Field>
                        </div>
                    </div>
                    {formError && <div style={{ marginTop: 10, color: C.danger, fontSize: 13 }}>{formError}</div>}
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        <Btn onClick={handleAdd} disabled={submitting}>{submitting ? "Adding…" : "Add"}</Btn>
                        <Btn variant="secondary" onClick={() => { setShowAdd(false); setFormError(""); }}>Cancel</Btn>
                    </div>
                </Card>
            )}

            <Card style={{ padding: 0, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <THead cols={["HH ID", "Head Name", "Phone", "Members", "Fuel Replaced", "Joined"]} />
                    <tbody>
                        {paginated.map((hh, i) => (
                            <tr key={hh.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                <td style={{ padding: "11px 14px", fontFamily: C.mono, fontWeight: 600, color: C.primary }}>{hh.id}</td>
                                <td style={{ padding: "11px 14px" }}>{hh.headName}</td>
                                <td style={{ padding: "11px 14px", fontFamily: C.mono }}>{hh.phone}</td>
                                <td style={{ padding: "11px 14px", textAlign: "center" }}>{hh.members}</td>
                                <td style={{ padding: "11px 14px" }}>
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                        {hh.fuelReplaced.map(f => <Tag key={f} color="amber">{f}</Tag>)}
                                    </div>
                                </td>
                                <td style={{ padding: "11px 14px", color: C.muted }}>{fmtDate(hh.joinedAt)}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.muted }}>
                                    No households for this digester.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <Paginator page={safePage} totalPages={totalPages} setPage={setPage} total={filtered.length} />
            </Card>
        </div>
    );
}
