"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import { Btn, Field, TI, AlertBox, Card, Heading, Tag } from "@/components/ui";
import { householdApi } from "@/lib/api/household.api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuthStore } from "@/store/authStore";
import { C } from "@/lib/utils/tokens";
import { FUEL_OPTIONS } from "@renew-hope/shared";
import { shortId } from "@/lib/utils/shortId";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormState {
    headName: string;
    phone: string;
    address: string;
    members: string;
    fuelReplaced: string[];
}

interface RegisteredHH {
    id: string;
    headName: string;
    phone: string;
    members: number;
    fuelReplaced: string[];
    joinedAt: string;
}

// ─── Fuel Multi-Select — exact mockup style ───────────────────────────────────
function FuelMultiSelect({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const toggle = (f: string) =>
        onChange(
            value.includes(f) ? value.filter(x => x !== f) : [...value, f]
        );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FUEL_OPTIONS.map(f => (
                <label
                    key={f}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        padding: "8px 12px",
                        background: value.includes(f) ? C.primary + "12" : C.bg,
                        borderRadius: 8,
                        border: `1.5px solid ${value.includes(f) ? C.primary : C.border}`,
                        transition: "all 0.15s",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={value.includes(f)}
                        onChange={() => toggle(f)}
                        style={{
                            accentColor: C.primary,
                            width: 16,
                            height: 16,
                            cursor: "pointer",
                        }}
                    />
                    <span style={{ fontSize: 13, fontFamily: C.sans }}>{f}</span>
                </label>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterHouseholdPage() {
    const { isOnline } = useOnlineStatus();
    const { user } = useAuthStore();

    const [form, setForm] = useState<FormState>({
        headName: "",
        phone: "",
        address: "",
        members: "",
        fuelReplaced: [],
    });

    const [households, setHouseholds] = useState<RegisteredHH[]>([]);
    const [loadingHH, setLoadingHH] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState<RegisteredHH | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const canSubmit =
        !!form.headName.trim() &&
        !!form.phone.trim() &&
        form.fuelReplaced.length > 0;

    // ── Load existing households ───────────────────────────────────────────────
    useEffect(() => {
        householdApi.getAll()
            .then((hh: RegisteredHH[]) => setHouseholds(hh))
            .catch(() => {})
            .finally(() => setLoadingHH(false));
    }, []);

    // ── Field updater ──────────────────────────────────────────────────────────
    const set = useCallback(
        <K extends keyof FormState>(key: K, val: FormState[K]) => {
            setForm(f => ({ ...f, [key]: val }));
            if (key === "phone") setPhoneError(null);
            setGeneralError(null);
        },
        []
    );

    // ── Submit ─────────────────────────────────────────────────────────────────
    async function handleSubmit() {
        // Client-side phone validation (matches server regex)
        const phoneOk = /^(?:0\d{9}|\+233\d{9})$/.test(form.phone.trim());
        if (!phoneOk) {
            setPhoneError("Enter a valid Ghana number: 0XXXXXXXXX or +233XXXXXXXXX");
            return;
        }

        setSubmitting(true);
        setGeneralError(null);
        try {
            const record = await householdApi.submit(
                {
                    headName: form.headName.trim(),
                    phone: form.phone.trim(),
                    address: form.address.trim() || undefined,
                    members: parseInt(form.members) || 1,
                    fuelReplaced: form.fuelReplaced,
                },
                isOnline
            );

            const newHH: RegisteredHH = {
                id: record.id,
                headName: form.headName.trim(),
                phone: form.phone.trim(),
                members: parseInt(form.members) || 1,
                fuelReplaced: form.fuelReplaced,
                joinedAt: new Date().toISOString(),
            };

            setHouseholds(prev => [newHH, ...prev]);
            setDone(newHH);
        } catch (err: unknown) {
            setGeneralError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    // ── Success screen ─────────────────────────────────────────────────────────
    if (done) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    padding: 48,
                    minHeight: "60dvh",
                }}
            >
                <div style={{ background: C.success + "18", borderRadius: 50, padding: 20 }}>
                    <CheckCircle size={42} color={C.success} />
                </div>
                <Heading size="lg">Household Registered!</Heading>
                <Card style={{ width: "100%", textAlign: "center" }}>
                    <div
                        style={{
                            fontFamily: C.mono,
                            fontSize: 22,
                            color: C.primary,
                            marginBottom: 6,
                        }}
                    >
                        {shortId(done.id)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: C.sans }}>
                        {done.headName}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontFamily: C.sans }}>
                        {done.fuelReplaced.join(", ") || "—"}
                    </div>
                </Card>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320, marginTop: 8 }}>
                    <Btn
                        fullWidth
                        size="lg"
                        onClick={() => {
                            setForm({ headName: "", phone: "", address: "", members: "", fuelReplaced: [] });
                            setDone(null);
                            setGeneralError(null);
                            setPhoneError(null);
                        }}
                    >
                        + Register Another
                    </Btn>
                    <Btn fullWidth size="lg" variant="secondary" onClick={() => window.history.back()}>
                        ← Back to Dashboard
                    </Btn>
                </div>
            </div>
        );
    }

    // ── Form ───────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
                <Heading size="xl">Register Household</Heading>
                <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                    {loadingHH
                        ? "Loading…"
                        : `${households.length} household${households.length !== 1 ? "s" : ""} on ${user?.digesterId ?? "—"}`}
                </p>
            </div>

            {!isOnline && (
                <AlertBox type="warning">Offline — will sync on reconnect.</AlertBox>
            )}

            {generalError && (
                <AlertBox type="error">{generalError}</AlertBox>
            )}

            <Card>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Field label="Head of Household" required>
                        <TI
                            value={form.headName}
                            onChange={e => set("headName", e.target.value)}
                            placeholder="Full name"
                        />
                    </Field>

                    <Field label="Phone" required error={phoneError ?? undefined}>
                        <TI
                            type="tel"
                            value={form.phone}
                            onChange={e => set("phone", e.target.value)}
                            placeholder="0XXXXXXXXX or +233XXXXXXXXX"
                        />
                    </Field>

                    <Field label="Address">
                        <TI
                            value={form.address}
                            onChange={e => set("address", e.target.value)}
                            placeholder="House / Plot / Lane"
                        />
                    </Field>

                    <Field label="Members">
                        <TI
                            type="number"
                            value={form.members}
                            onChange={e => set("members", e.target.value)}
                            placeholder="e.g. 4"
                            min="1"
                            inputMode="numeric"
                        />
                    </Field>

                    <Field
                        label="Fuels Being Replaced by Biogas"
                        required
                        note="Select all that apply"
                    >
                        <FuelMultiSelect
                            value={form.fuelReplaced}
                            onChange={v => set("fuelReplaced", v)}
                        />
                    </Field>

                    <Btn
                        fullWidth
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                    >
                        {submitting ? "Registering…" : "Register Household"}
                    </Btn>
                </div>
            </Card>

            {/* Recent households list */}
            {!loadingHH && households.length > 0 && (
                <div>
                    <Heading
                        size="sm"
                        style={{ marginBottom: 10, color: C.muted }}
                    >
                        REGISTERED ({households.length})
                    </Heading>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {households.slice(0, 5).map(hh => (
                            <Card
                                key={hh.id}
                                style={{
                                    padding: "10px 14px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: C.sans }}>
                                        {hh.headName}
                                    </div>
                                    <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }}>
                                        {hh.phone} · {hh.members} member{hh.members !== 1 ? "s" : ""}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <Tag color="purple">{shortId(hh.id)}</Tag>
                                    <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontFamily: C.sans }}>
                                        {(Array.isArray(hh.fuelReplaced)
                                            ? hh.fuelReplaced
                                            : hh.fuelReplaced
                                            ? [hh.fuelReplaced]
                                            : []
                                        ).join(", ")}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
