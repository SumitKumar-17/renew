"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import { Btn, Field, TI, AlertBox, Card, Heading, ConfirmSheet } from "@/components/ui";
import { distributionApi } from "@/lib/api/distribution.api";
import { householdApi } from "@/lib/api/household.api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { C } from "@/lib/utils/tokens";
import { shortId } from "@/lib/utils/shortId";

// ─── Types ───────────────────────────────────────────────────────────────────
interface HouseholdEntry {
    householdId: string;
    householdName: string;
    volume: number;
    include: boolean;
}

interface GasBalance {
    totalProduced: number;
    totalDistributed: number;
    surplus: number;
    isDeficit: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function fmtDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DistributionPage() {
    const { isOnline } = useOnlineStatus();

    const [date, setDate] = useState(todayISO());
    const [entries, setEntries] = useState<HouseholdEntry[]>([]);
    const [balance, setBalance] = useState<GasBalance | null>(null);
    const [loading, setLoading] = useState(true);

    const [confirm, setConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [doneCount, setDoneCount] = useState(0);
    const [doneDate, setDoneDate] = useState("");
    const [savedOffline, setSavedOffline] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    // ── Load households + balance on mount ────────────────────────────────────
    useEffect(() => {
        Promise.all([
            householdApi.getAll(),
            distributionApi.getBalance(),
        ])
            .then(([households, bal]) => {
                setEntries(
                    households.map((hh: any) => ({
                        householdId: hh.id,
                        householdName: hh.headName,
                        volume: 1.5,
                        include: true,
                    }))
                );
                setBalance(bal);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // ── Derived ───────────────────────────────────────────────────────────────
    const selected = entries.filter(e => e.include);
    const totalDist = selected.reduce((s, e) => s + e.volume, 0);
    const surplus = balance?.surplus ?? 0;
    const wouldExceed = totalDist > surplus && surplus >= 0;

    // ── Toggle / update entry ─────────────────────────────────────────────────
    const toggleEntry = useCallback((i: number, checked: boolean) => {
        setEntries(p => p.map((x, j) => j === i ? { ...x, include: checked } : x));
    }, []);

    const updateVolume = useCallback((i: number, val: string) => {
        setEntries(p => p.map((x, j) => j === i ? { ...x, volume: parseFloat(val) || 0 } : x));
    }, []);

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSubmit() {
        setSubmitting(true);
        setGeneralError(null);
        try {
            const householdMap = new Map(
                entries.map(e => [e.householdId, e.householdName])
            );

            const result = await distributionApi.submit(
                { date, items: selected.map(e => ({ householdId: e.householdId, volume: e.volume })) },
                isOnline,
                householdMap
            );

            setSavedOffline(!result.synced);
            setDoneCount(selected.length);
            setDoneDate(date);
            setConfirm(false);
            setDone(true);
        } catch (err: unknown) {
            setConfirm(false);
            setGeneralError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    // ── Success screen ────────────────────────────────────────────────────────
    if (done) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    padding: 64,
                    minHeight: "60dvh",
                }}
            >
                <div style={{ background: C.info + "18", borderRadius: 50, padding: 20 }}>
                    <CheckCircle size={42} color={C.info} />
                </div>
                <Heading size="lg">Distribution Logged!</Heading>
                <p style={{ color: C.muted, fontSize: 14, textAlign: "center" }}>
                    {doneCount} household{doneCount !== 1 ? "s" : ""} recorded for {fmtDate(doneDate)}.
                </p>
                {savedOffline && (
                    <p style={{ color: C.muted, fontSize: 12 }}>Saved offline — will sync on reconnect.</p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320, marginTop: 8 }}>
                    <Btn
                        fullWidth
                        size="lg"
                        onClick={() => {
                            setDone(false);
                            setDate(todayISO());
                            setGeneralError(null);
                            // reset entries to default volumes, reload balance
                            setEntries(p => p.map(e => ({ ...e, volume: 1.5, include: true })));
                            distributionApi.getBalance()
                                .then(bal => setBalance(bal))
                                .catch(() => {});
                        }}
                    >
                        + Log Another
                    </Btn>
                    <Btn fullWidth size="lg" variant="secondary" onClick={() => window.history.back()}>
                        ← Back to Dashboard
                    </Btn>
                </div>
            </div>
        );
    }

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
                    <div style={{ ...shimmer, width: 200, height: 28 }} />
                    <div style={{ ...shimmer, width: 260, height: 14 }} />
                    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                        <div style={{ ...shimmer, width: 120, height: 12, marginBottom: 8 }} />
                        <div style={{ ...shimmer, width: "100%", height: 42 }} />
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ ...shimmer, width: 17, height: 17, borderRadius: 3, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ ...shimmer, width: 120, height: 14, marginBottom: 6 }} />
                                <div style={{ ...shimmer, width: 80, height: 11 }} />
                            </div>
                            <div style={{ ...shimmer, width: 68, height: 36, borderRadius: 6 }} />
                        </div>
                    ))}
                </div>
            </>
        );
    }

    // ── Form ──────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <Heading size="xl">Distribute Gas</Heading>
                <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                    Default 1.5 m³/HH. Edit as needed.
                </p>
            </div>

            {!isOnline && (
                <AlertBox type="warning">Offline — will sync on reconnect.</AlertBox>
            )}

            {wouldExceed && (
                <AlertBox type="error">
                    Distribution ({totalDist.toFixed(1)} m³) exceeds available surplus ({surplus.toFixed(1)} m³).
                </AlertBox>
            )}

            {generalError && (
                <AlertBox type="error">{generalError}</AlertBox>
            )}

            {/* Date picker */}
            <Card>
                <Field label="Distribution Date" required>
                    <TI
                        type="date"
                        value={date}
                        max={todayISO()}
                        onChange={e => setDate(e.target.value)}
                    />
                </Field>
            </Card>

            {/* Household list */}
            {entries.length === 0 ? (
                <Card style={{ textAlign: "center", color: C.muted, padding: 40 }}>
                    No households registered yet.
                </Card>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {entries.map((e, i) => (
                        <Card
                            key={e.householdId}
                            style={{
                                padding: "11px 14px",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                opacity: e.include ? 1 : 0.45,
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={e.include}
                                onChange={ev => toggleEntry(i, ev.target.checked)}
                                style={{
                                    width: 17,
                                    height: 17,
                                    cursor: "pointer",
                                    accentColor: C.primary,
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: C.sans, color: C.text }}>
                                    {e.householdName}
                                </div>
                                <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }}>
                                    {shortId(e.householdId)}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input
                                    type="number"
                                    value={e.volume}
                                    step="0.1"
                                    min="0"
                                    onChange={ev => updateVolume(i, ev.target.value)}
                                    style={{
                                        width: 68,
                                        border: `1.5px solid ${C.border}`,
                                        borderRadius: 6,
                                        padding: "5px 8px",
                                        fontSize: 14,
                                        fontFamily: C.mono,
                                        textAlign: "right",
                                        color: C.text,
                                        outline: "none",
                                        background: C.card,
                                    }}
                                />
                                <span style={{ fontSize: 11, color: C.muted }}>m³</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Summary bar */}
            {entries.length > 0 && (
                <Card style={{ background: C.primary, border: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#9DC0AB", fontSize: 13, fontFamily: C.sans }}>
                            {selected.length} of {entries.length} households
                        </span>
                        <span style={{ fontFamily: C.mono, fontSize: 20, color: wouldExceed ? "#FF9999" : "#fff" }}>
                            {totalDist.toFixed(1)}{" "}
                            <span style={{ fontSize: 12, color: "#9DC0AB" }}>m³ total</span>
                        </span>
                    </div>
                </Card>
            )}

            <Btn
                fullWidth
                size="lg"
                onClick={() => setConfirm(true)}
                disabled={selected.length === 0 || wouldExceed}
            >
                Review &amp; Submit ({selected.length} HH) →
            </Btn>

            {confirm && (
                <ConfirmSheet
                    title="Confirm Gas Distribution"
                    rows={[
                        { label: "Date", value: fmtDate(date) },
                        { label: "Households", value: `${selected.length}` },
                        { label: "Total Volume", value: `${totalDist.toFixed(1)} m³` },
                        { label: "Produced (total)", value: `${(balance?.totalProduced ?? 0).toFixed(1)} m³` },
                        { label: "Balance after", value: `${(surplus - totalDist).toFixed(1)} m³` },
                    ]}
                    confirmLabel="Submit Distribution"
                    onConfirm={handleSubmit}
                    onCancel={() => setConfirm(false)}
                    offline={!isOnline}
                />
            )}
        </div>
    );
}
