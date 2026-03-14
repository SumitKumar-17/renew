"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { operatorsApi, digestersApi, type Operator, type Digester } from "@/lib/api/admin.api";
import { Card, Heading, Tag, Btn, Field, TI, SI, AlertBox, THead, Paginator } from "@/components/ui";
import { C } from "@/lib/utils/tokens";

const PAGE_SIZE = 10;

function fmtDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

export default function OperatorsPage() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [digesters, setDigesters] = useState<Digester[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", digesterId: "", password: "" });
    const [formError, setFormError] = useState("");
    const [toast, setToast] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        Promise.all([operatorsApi.getAll(), digestersApi.getAll()])
            .then(([ops, digs]) => {
                setOperators(ops);
                setDigesters(digs);
            })
            .finally(() => setLoading(false));
    }, []);

    const totalPages = Math.max(1, Math.ceil(operators.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = operators.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    // Only unassigned digesters available to assign
    const availableDigesters = digesters.filter(d => !d.operator);

    const handleAdd = async () => {
        if (!form.name || !form.phone || !form.password) {
            setFormError("Name, phone, and password are required");
            return;
        }
        setSubmitting(true);
        setFormError("");
        try {
            const result = await operatorsApi.create({
                name: form.name,
                phone: form.phone,
                password: form.password,
                digesterId: form.digesterId || undefined,
            });
            const created: Operator = result.data;
            setOperators(prev => [...prev, created]);
            setForm({ name: "", phone: "", digesterId: "", password: "" });
            setShowAdd(false);
            setToast(`Operator ${created.id} created. Login: ${created.id} · Password: ${form.password}`);
            setTimeout(() => setToast(""), 6000);
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? "Failed to create operator");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (id: string, current: string) => {
        const next = current === "active" ? "inactive" : "active";
        try {
            await operatorsApi.updateStatus(id, next);
            setOperators(prev =>
                prev.map(op => op.id === id ? { ...op, status: next } : op)
            );
        } catch { /* ignore */ }
    };

    if (loading) return <div style={{ color: C.muted, padding: 40 }}>Loading…</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Heading size="xl">Operators</Heading>
                <Btn icon={Plus} onClick={() => setShowAdd(true)}>Add Operator</Btn>
            </div>

            {toast && <AlertBox type="success">{toast}</AlertBox>}

            {showAdd && (
                <Card style={{ border: `2px solid ${C.primary}` }} className="fade-in">
                    <Heading size="md" style={{ marginBottom: 16 }}>New Operator</Heading>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Full Name" required>
                            <TI value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Operator name" />
                        </Field>
                        <Field label="Phone" required>
                            <TI value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} type="tel" placeholder="10-digit mobile" />
                        </Field>
                        <Field label="Assign Digester">
                            <SI
                                value={form.digesterId}
                                onChange={e => setForm(f => ({ ...f, digesterId: e.target.value }))}
                                placeholder="— Unassigned —"
                                options={availableDigesters.map(d => ({ value: d.id, label: `${d.id} – ${d.location}` }))}
                            />
                        </Field>
                        <Field label="Password" required>
                            <TI value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Initial password" />
                        </Field>
                    </div>
                    {formError && <div style={{ marginTop: 10, color: C.danger, fontSize: 13 }}>{formError}</div>}
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        <Btn onClick={handleAdd} disabled={submitting}>{submitting ? "Creating…" : "Create"}</Btn>
                        <Btn variant="secondary" onClick={() => { setShowAdd(false); setFormError(""); }}>Cancel</Btn>
                    </div>
                </Card>
            )}

            <Card style={{ padding: 0, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <THead cols={["Operator ID", "Name", "Phone", "Digester", "Joined", "Status", "Action"]} />
                    <tbody>
                        {paginated.map((op, i) => (
                            <tr key={op.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                <td style={{ padding: "12px 14px", fontFamily: C.mono, fontWeight: 600, color: C.primary }}>{op.id}</td>
                                <td style={{ padding: "12px 14px" }}>{op.name}</td>
                                <td style={{ padding: "12px 14px", fontFamily: C.mono }}>{op.phone}</td>
                                <td style={{ padding: "12px 14px" }}>
                                    {op.digesterId
                                        ? <Tag color="green">{op.digesterId}</Tag>
                                        : <Tag color="gray">Unassigned</Tag>
                                    }
                                </td>
                                <td style={{ padding: "12px 14px", color: C.muted }}>{fmtDate(op.createdAt)}</td>
                                <td style={{ padding: "12px 14px" }}>
                                    <Tag color={op.status === "active" ? "green" : "gray"}>{op.status}</Tag>
                                </td>
                                <td style={{ padding: "12px 14px" }}>
                                    <Btn
                                        size="sm"
                                        variant={op.status === "active" ? "danger" : "secondary"}
                                        onClick={() => toggleStatus(op.id, op.status)}
                                    >
                                        {op.status === "active" ? "Deactivate" : "Activate"}
                                    </Btn>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Paginator page={safePage} totalPages={totalPages} setPage={setPage} total={operators.length} />
            </Card>
        </div>
    );
}
