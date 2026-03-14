"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api/admin.api";
import { useAuthStore } from "@/store/authStore";
import { C } from "@/lib/utils/tokens";

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

            if (result.user.role !== "admin") {
                setError("Only admin accounts can access this portal");
                return;
            }

            setAuth(result.user as any, result.accessToken);
            router.replace("/overview");
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Invalid credentials");
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
                        ADMIN PORTAL
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
                        Sign In — Admin
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* ID */}
                        <div>
                            <label
                                style={{
                                    fontSize: 11,
                                    color: C.muted,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.8,
                                    fontFamily: C.sans,
                                    display: "block",
                                    marginBottom: 6,
                                }}
                            >
                                Admin ID *
                            </label>
                            <input
                                value={id}
                                onChange={e => setId(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                placeholder="e.g. ADMIN"
                                style={{
                                    border: `1.5px solid ${C.border}`,
                                    borderRadius: 8,
                                    padding: "10px 13px",
                                    fontSize: 14,
                                    fontFamily: C.sans,
                                    color: C.text,
                                    background: C.card,
                                    width: "100%",
                                    outline: "none",
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                style={{
                                    fontSize: 11,
                                    color: C.muted,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.8,
                                    fontFamily: C.sans,
                                    display: "block",
                                    marginBottom: 6,
                                }}
                            >
                                Password *
                            </label>
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
                                        padding: "10px 42px 10px 13px",
                                        fontSize: 14,
                                        fontFamily: C.sans,
                                        color: C.text,
                                        background: C.card,
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
                                        color: C.muted,
                                        display: "flex",
                                    }}
                                >
                                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                style={{
                                    background: "#FFF1F1",
                                    border: `1px solid #FCA5A5`,
                                    borderRadius: 8,
                                    padding: "10px 14px",
                                    fontSize: 13,
                                    color: C.danger,
                                    fontFamily: C.sans,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            style={{
                                background: C.primary,
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "12px 24px",
                                fontSize: 15,
                                fontWeight: 600,
                                fontFamily: C.sans,
                                width: "100%",
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Signing in..." : "Sign In →"}
                        </button>
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
                        ADMIN / admin123
                    </div>
                </div>
            </div>
        </div>
    );
}
