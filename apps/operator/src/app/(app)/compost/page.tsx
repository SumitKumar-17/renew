"use client";

import { useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import { Btn, Field, TI, TA, AlertBox, Card, Heading, ConfirmSheet } from "@/components/ui";
import { PhotoUploader } from "@/components/forms/PhotoUploader";
import { compostApi } from "@/lib/api/compost.api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuthStore } from "@/store/authStore";
import { C } from "@/lib/utils/tokens";

// Purple compost accent — matches mockup exactly
const COMPOST_COLOR = "#7C3AED";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormState {
    date: string;
    bags: string;
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
export default function CompostPage() {
    const { isOnline } = useOnlineStatus();
    const { user } = useAuthStore();

    const [form, setForm] = useState<FormState>({
        date: todayISO(),
        bags: "",
        notes: "",
        photo: null,
        photoPreview: undefined,
    });

    const [confirm, setConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [savedOffline, setSavedOffline] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const canSubmit = !!form.bags && parseInt(form.bags) > 0 && !!form.photo;

    // ── Field updater ──────────────────────────────────────────────────────────
    const set = useCallback(
        <K extends keyof FormState>(key: K, val: FormState[K]) => {
            setForm(f => ({ ...f, [key]: val }));
        },
        []
    );

    // ── Submit ─────────────────────────────────────────────────────────────────
    async function handleSubmit() {
        setSubmitting(true);
        setGeneralError(null);
        try {
            const status = await compostApi.submit(
                {
                    date: form.date,
                    bags: parseInt(form.bags),
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
                    padding: 64,
                    minHeight: "60dvh",
                }}
            >
                <div style={{ background: COMPOST_COLOR + "18", borderRadius: 50, padding: 20 }}>
                    <CheckCircle size={42} color={COMPOST_COLOR} />
                </div>
                <Heading size="lg">Compost Log Saved!</Heading>
                <p style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>
                    {savedOffline ? "Saved offline." : "Compost entry recorded."}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320, marginTop: 8 }}>
                    <Btn
                        fullWidth
                        size="lg"
                        onClick={() => {
                            setForm({ date: todayISO(), bags: "", notes: "", photo: null, photoPreview: undefined });
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

    // ── Form ───────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
                <Heading size="xl">Compost Log</Heading>
                <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                    Log daily compost bags from digestate.
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
                                onChange={e => set("date", e.target.value)}
                            />
                        </Field>
                        <Field label="Digester">
                            <TI value={user?.digesterId ?? "—"} onChange={() => {}} disabled />
                        </Field>
                    </div>

                    <Field label="Number of Bags" required>
                        <TI
                            type="number"
                            value={form.bags}
                            onChange={e => set("bags", e.target.value)}
                            placeholder="e.g. 5"
                            min="1"
                            step="1"
                            inputMode="numeric"
                        />
                    </Field>

                    <Field label="Photo of Compost Bags" required note="Required — photograph the filled bags">
                        <PhotoUploader
                            photo={form.photoPreview}
                            photoName={form.photo?.name}
                            accentColor={COMPOST_COLOR}
                            label="Compost photo"
                            onPhotoChange={(file, preview) => {
                                set("photo", file);
                                set("photoPreview", preview);
                            }}
                        />
                    </Field>

                    <Field label="Notes">
                        <TA
                            value={form.notes}
                            onChange={e => set("notes", e.target.value)}
                            placeholder="Colour, texture, drying status..."
                        />
                    </Field>

                    <Btn fullWidth size="lg" onClick={() => setConfirm(true)} disabled={!canSubmit}>
                        Review &amp; Submit →
                    </Btn>

                    {!canSubmit && (
                        <p style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
                            Number of bags and photo required.
                        </p>
                    )}
                </div>
            </Card>

            {confirm && (
                <ConfirmSheet
                    title="Confirm Compost Entry"
                    rows={[
                        { label: "Date", value: fmtDate(form.date) },
                        { label: "Bags", value: form.bags },
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
