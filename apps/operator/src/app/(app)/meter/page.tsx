"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import {
    Btn, Field, TI, TA, AlertBox, Card, Heading, ConfirmSheet,
} from "@/components/ui";
import { PhotoUploader } from "@/components/forms/PhotoUploader";
import { meterApi } from "@/lib/api/meter.api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuthStore } from "@/store/authStore";
import { C } from "@/lib/utils/tokens";

// ─── Types ───────────────────────────────────────────────────────────────────
interface LastReading {
    reading: number;
    date: string;
}

interface FormState {
    date: string;
    reading: string;
    notes: string;
    photo: File | null;
    photoPreview?: string;
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
export default function MeterPage() {
    const { isOnline } = useOnlineStatus();
    const { user } = useAuthStore();

    const [lastReading, setLastReading] = useState<LastReading | null>(null);
    const [loadingLast, setLoadingLast] = useState(true);

    const [form, setForm] = useState<FormState>({
        date: todayISO(),
        reading: "",
        notes: "",
        photo: null,
        photoPreview: undefined,
    });

    const [confirm, setConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [savedOffline, setSavedOffline] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    // ── Load last reading on mount ──────────────────────────────────────────────
    useEffect(() => {
        meterApi.getLastReading()
            .then(r => setLastReading(r ?? null))
            .catch(() => setLastReading(null))
            .finally(() => setLoadingLast(false));
    }, []);

    // ── Derived state ───────────────────────────────────────────────────────────
    const currentReading = parseFloat(form.reading) || 0;
    const isFirstEntry = !loadingLast && lastReading === null;
    const lastValue = lastReading?.reading ?? 0;
    const readingTooLow = !!form.reading && currentReading <= lastValue;

    const dailyProduction =
        form.reading && currentReading > lastValue
            ? (currentReading - lastValue).toFixed(2)
            : null;

    const canSubmit = !!form.reading && !!form.photo && !readingTooLow;

    // ── Field updater ──────────────────────────────────────────────────────────
    const set = useCallback(
        <K extends keyof FormState>(key: K, val: FormState[K]) => {
            setForm((f) => ({ ...f, [key]: val }));
        },
        []
    );

    // ── Submit ──────────────────────────────────────────────────────────────────
    async function handleSubmit() {
        setSubmitting(true);
        setGeneralError(null);
        try {
            const status = await meterApi.submit(
                {
                    date: form.date,
                    reading: currentReading,
                    notes: form.notes.trim() || undefined,
                },
                form.photo!,
                isOnline
            );
            setSavedOffline(!status.synced);
            setConfirm(false);
            setDone(true);
        } catch (err: unknown) {
            setConfirm(false);
            setGeneralError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    // ── Success screen ──────────────────────────────────────────────────────────
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
                <div
                    style={{
                        background: C.accent + "18",
                        borderRadius: 50,
                        padding: 20,
                    }}
                >
                    <CheckCircle size={42} color={C.accent} />
                </div>

                <Heading size="lg">Meter Reading Logged!</Heading>

                {dailyProduction && (
                    <Card style={{ textAlign: "center", width: "100%" }}>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontFamily: C.mono, letterSpacing: 1 }}>
                            TODAY&apos;S GAS PRODUCTION
                        </div>
                        <div style={{ fontFamily: C.mono, fontSize: 32, color: C.accent, fontWeight: 700 }}>
                            {dailyProduction} <span style={{ fontSize: 14 }}>m³</span>
                        </div>
                    </Card>
                )}

                <p style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>
                    {savedOffline ? "Saved offline." : "Reading saved successfully."}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320, marginTop: 8 }}>
                    <Btn
                        fullWidth
                        size="lg"
                        onClick={() => {
                            setForm({ date: todayISO(), reading: "", notes: "", photo: null, photoPreview: undefined });
                            setDone(false);
                            setGeneralError(null);
                            // refresh last reading
                            setLoadingLast(true);
                            meterApi.getLastReading()
                                .then(r => setLastReading(r ?? null))
                                .catch(() => {})
                                .finally(() => setLoadingLast(false));
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

    // ── Form ────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
                <Heading size="xl">Flow Meter Reading</Heading>
                <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                    Cumulative meter — daily production auto-calculated.
                </p>
            </div>

            {!isOnline && (
                <AlertBox type="warning">Offline — will sync on reconnect.</AlertBox>
            )}

            {generalError && (
                <AlertBox type="error">{generalError}</AlertBox>
            )}

            {/* Last reading summary card — always shown once loaded */}
            {!loadingLast && (
                <Card style={{ background: C.primary, border: "none" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                        <div>
                            <div style={{ fontSize: 10, color: "#9DC0AB", fontFamily: C.mono, letterSpacing: 1.5 }}>
                                LAST READING
                            </div>
                            <div style={{ fontFamily: C.mono, fontSize: 22, color: "#fff", marginTop: 4 }}>
                                {lastReading ? lastReading.reading : 0} m³
                            </div>
                            <div style={{ fontSize: 11, color: "#9DC0AB", marginTop: 2 }}>
                                {lastReading ? fmtDate(lastReading.date) : "No readings yet"}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: "#9DC0AB", fontFamily: C.mono, letterSpacing: 1.5 }}>
                                TODAY&apos;S PRODUCTION
                            </div>
                            <div
                                style={{
                                    fontFamily: C.mono,
                                    fontSize: 22,
                                    color: dailyProduction ? C.accentLight : "rgba(255,255,255,0.38)",
                                    marginTop: 4,
                                }}
                            >
                                {dailyProduction
                                    ? `${dailyProduction} m³`
                                    : form.reading
                                    ? "Enter reading below"
                                    : "—"}
                            </div>
                            <div style={{ fontSize: 11, color: "#9DC0AB", marginTop: 2 }}>
                                {dailyProduction ? "(Today − Yesterday)" : "Awaiting input"}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* First-entry guidance */}
            {isFirstEntry && (
                <AlertBox type="warning">
                    This is your first reading. It will be saved as the opening meter value.
                    Daily production will calculate from tomorrow onwards.
                </AlertBox>
            )}

            <Card>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                        <Field label="Date" required>
                            <TI
                                type="date"
                                value={form.date}
                                max={todayISO()}
                                onChange={(e) => set("date", e.target.value)}
                            />
                        </Field>
                        <Field label="Digester">
                            <TI value={user?.digesterId ?? "—"} onChange={() => {}} disabled />
                        </Field>
                    </div>

                    <Field
                        label="Meter Reading (cumulative m³)"
                        required
                        note="Enter the number shown on the flow meter display"
                    >
                        <TI
                            type="number"
                            value={form.reading}
                            onChange={(e) => set("reading", e.target.value)}
                            placeholder={
                                lastReading ? `Last: ${lastReading.reading}` : "e.g. 108.5"
                            }
                            step="0.1"
                            min="0"
                            inputMode="decimal"
                        />
                    </Field>

                    {readingTooLow && (
                        <AlertBox type="error">
                            Reading must be greater than last reading ({lastValue} m³). Check the meter.
                        </AlertBox>
                    )}

                    <Field label="Photo of Meter Display" required note="Photo mandatory for verification">
                        <PhotoUploader
                            photo={form.photoPreview}
                            photoName={form.photo?.name}
                            accentColor={C.accent}
                            label="Meter photo"
                            onPhotoChange={(file, preview) => {
                                set("photo", file);
                                set("photoPreview", preview);
                            }}
                        />
                    </Field>

                    <Field label="Notes">
                        <TA
                            value={form.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            placeholder="Maintenance, blockage, unusual reading..."
                        />
                    </Field>

                    <Btn
                        fullWidth
                        size="lg"
                        onClick={() => setConfirm(true)}
                        disabled={!canSubmit}
                    >
                        Review &amp; Submit →
                    </Btn>
                </div>
            </Card>

            {confirm && (
                <ConfirmSheet
                    title="Confirm Meter Reading"
                    rows={[
                        { label: "Date", value: fmtDate(form.date) },
                        { label: "Meter Reading", value: `${form.reading} m³` },
                        {
                            label: "Daily Production",
                            value: isFirstEntry
                                ? "Opening entry"
                                : dailyProduction
                                ? `${dailyProduction} m³`
                                : "—",
                        },
                        { label: "Photo", value: "✓ Attached" },
                        { label: "Notes", value: form.notes || "—" },
                    ]}
                    onConfirm={handleSubmit}
                    onCancel={() => setConfirm(false)}
                    offline={!isOnline}
                />
            )}
        </div>
    );
}
