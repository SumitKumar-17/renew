"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { C } from "@/lib/utils/tokens";
import { Btn, Field, TI, AlertBox } from "@/components/ui";

export default function LoginPage() {
    const [id, setId] = useState("");
    const [pw, setPw] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { setAuth } = useAuthStore();
    const router = useRouter();

    const handleLogin = async () => {
        if (!id || !pw) {
            setError("Please enter your ID and password");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await authApi.login(id.trim(), pw);
            await setAuth(result.user as any, result.token, result.refreshToken);

            if (result.user.role === "admin") {
                // Admin goes to admin app — not operator app
                setError("Admin accounts cannot access the operator app");
                return;
            }

            router.replace("/dashboard");

        } catch (err: any) {
            if (!navigator.onLine) {
                setError("You must be online to sign in");
            } else {
                setError(
                    err?.response?.data?.message ?? "Invalid credentials"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: C.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
            }}
        >
            <div style={{ width: "100%", maxWidth: 400 }}>

                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <div
                        style={{
                            width: 58,
                            height: 58,
                            borderRadius: 16,
                            background: C.accent,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16,
                        }}
                    >
                        <Flame size={28} color="#fff" />
                    </div>
                    <div
                        style={{
                            fontFamily: C.display,
                            color: "#fff",
                            fontSize: 22,
                            fontWeight: 700,
                            letterSpacing: 1,
                        }}
                    >
                        RENEW HOPE
                    </div>
                    <div
                        style={{
                            fontFamily: C.mono,
                            color: C.accentLight,
                            fontSize: 11,
                            letterSpacing: 2.5,
                            marginTop: 4,
                        }}
                    >
                        MRV PLATFORM
                    </div>
                </div>

                {/* Card */}
                <div
                    style={{
                        background: C.card,
                        borderRadius: 16,
                        padding: "28px 24px",
                    }}
                    className="fade-in"
                >
                    <div
                        style={{
                            fontFamily: C.display,
                            fontWeight: 700,
                            fontSize: 20,
                            color: C.text,
                            marginBottom: 24,
                        }}
                    >
                        Sign In
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        {/* ID Field */}
                        <Field label="Operator ID" required>
                            <TI
                                value={id}
                                onChange={e => setId(e.target.value)}
                                placeholder="e.g. OP001"
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                            />
                        </Field>

                        {/* Password Field */}
                        <Field label="Password" required>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={show ? "text" : "password"}
                                    value={pw}
                                    onChange={e => setPw(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                                    placeholder="Enter password"
                                    style={{
                                        border: `1.5px solid ${C.border}`,
                                        borderRadius: 8,
                                        padding: "9px 42px 9px 13px",
                                        fontSize: 14,
                                        fontFamily: C.sans,
                                        color: C.text,
                                        background: "#fff",
                                        width: "100%",
                                        outline: "none",
                                    }}
                                />
                                <button
                                    onClick={() => setShow(s => !s)}
                                    style={{
                                        position: "absolute",
                                        right: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: C.muted,
                                        display: "flex",
                                    }}
                                >
                                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </Field>

                        {/* Error */}
                        {error && (
                            <AlertBox type="error">{error}</AlertBox>
                        )}

                        {/* Submit */}
                        <Btn
                            onClick={handleLogin}
                            fullWidth
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In →"}
                        </Btn>
                    </div>

                    {/* Dev hint */}
                    <div
                        style={{
                            marginTop: 18,
                            padding: "12px 14px",
                            background: C.bg,
                            borderRadius: 8,
                            fontSize: 11,
                            fontFamily: C.mono,
                            color: C.muted,
                            lineHeight: 1.9,
                        }}
                    >
                        OP001 / pass123 · OP002 / pass456
                    </div>
                </div>
            </div>
        </div>
    );
}