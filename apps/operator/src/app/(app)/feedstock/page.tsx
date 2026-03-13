"use client";

import { useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import { Btn, Field, TI, SI, TA, AlertBox, Card, Heading, ConfirmSheet } from "@/components/ui";
import { PhotoUploader } from "@/components/forms/PhotoUploader";
import { feedstockApi } from "@/lib/api/feedstock.api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuthStore } from "@/store/authStore";
import { C } from "@/lib/utils/tokens";

// ─── Constants ───────────────────────────────────────────────────────────────
const FEEDSTOCK_TYPES = [
    "Kitchen Waste",
    "Animal Dung (Cow)",
    "Animal Dung (Pig)",
    "Crop Residue",
    "Market Waste",
    "Mixed Organic",
] as const;

type FeedstockType = (typeof FEEDSTOCK_TYPES)[number];

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormState {
    date: string;
    type: FeedstockType | "";
    weight: string;
    waterLitres: string;
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
export default function FeedstockPage() {
    const { isOnline } = useOnlineStatus();
    const { user } = useAuthStore();

    const [form, setForm] = useState<FormState>({
        date: todayISO(),
        type: "",
        weight: "",
        waterLitres: "",
        notes: "",
        photo: null,
        photoPreview: undefined,
    });

    const [confirm, setConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [offline, setOffline] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const canSubmit = !!form.weight && !!form.type && !!form.photo;

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
            const status = await feedstockApi.submit(
                {
                    date: form.date,
                    type: form.type as FeedstockType,
                    weight: Number(form.weight),
                    waterLitres: form.waterLitres !== "" ? Number(form.waterLitres) : 0,
                    notes: form.notes.trim() || undefined,
                },
                form.photo!,
                isOnline
            );
            setOffline(!status.synced);
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
                        background: offline ? C.accent + "18" : C.success + "18",
                        borderRadius: 50,
                        padding: 20,
                    }}
                >
                    <CheckCircle size={42} color={offline ? C.accent : C.success} />
                </div>
                <Heading size="lg">Entry Submitted!</Heading>
                <p style={{ color: C.muted, fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
                    {offline
                        ? "Saved offline. Will sync when connected."
                        : "Feedstock log saved. You can add another entry for today."}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320, marginTop: 8 }}>
                    <Btn
                        fullWidth
                        size="lg"
                        onClick={() => {
                            setForm({ date: todayISO(), type: "", weight: "", waterLitres: "", notes: "", photo: null, photoPreview: undefined });
                            setDone(false);
                            setGeneralError(null);
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
                <Heading size="xl">Log Feedstock</Heading>
                <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                    Multiple entries per day are allowed.
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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

                    <Field label="Feedstock Type" required>
                        <SI
                            value={form.type}
                            onChange={(e) => set("type", e.target.value as FeedstockType)}
                            options={FEEDSTOCK_TYPES as unknown as string[]}
                        />
                    </Field>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Weight (kg)" required>
                            <TI
                                type="number"
                                value={form.weight}
                                onChange={(e) => set("weight", e.target.value)}
                                placeholder="e.g. 45"
                                step="0.1"
                                min="0"
                                inputMode="decimal"
                            />
                        </Field>
                        <Field label="Water Added (litres)" note="Dilution water added">
                            <TI
                                type="number"
                                value={form.waterLitres}
                                onChange={(e) => set("waterLitres", e.target.value)}
                                placeholder="e.g. 20"
                                step="1"
                                min="0"
                                inputMode="decimal"
                            />
                        </Field>
                    </div>

                    <Field label="Photo of Feedstock" required note="Required for audit record">
                        <PhotoUploader
                            photo={form.photoPreview}
                            photoName={form.photo?.name}
                            onPhotoChange={(file, preview) => {
                                set("photo", file);
                                set("photoPreview", preview);
                            }}
                        />
                    </Field>

                    <Field label="Notes / Observations">
                        <TA
                            value={form.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            placeholder="Moisture level, odour, slurry condition..."
                        />
                    </Field>

                    <Btn fullWidth size="lg" onClick={() => setConfirm(true)} disabled={!canSubmit}>
                        Review &amp; Submit →
                    </Btn>

                    {!canSubmit && (
                        <p style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
                            Fill all required fields and attach a photo to continue.
                        </p>
                    )}
                </div>
            </Card>

            {confirm && (
                <ConfirmSheet
                    title="Confirm Feedstock Entry"
                    rows={[
                        { label: "Date", value: fmtDate(form.date) },
                        { label: "Type", value: form.type },
                        { label: "Weight", value: `${form.weight} kg` },
                        { label: "Water Added", value: `${form.waterLitres || 0} L` },
                        { label: "Photo", value: "✓ Attached" },
                        { label: "Notes", value: form.notes || "—" },
                        { label: "Digester", value: user?.digesterId ?? "—" },
                    ]}
                    onConfirm={handleSubmit}
                    onCancel={() => setConfirm(false)}
                    offline={!isOnline}
                />
            )}
        </div>
    );
}
