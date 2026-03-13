"use client";

import React from "react";
import { C } from "@/lib/utils/tokens";
import { FUEL_OPTIONS } from "@renew-hope/shared";
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";

// ── CARD ─────────────────────────────────────────────────
export const Card = ({
    children,
    style = {},
    onClick,
    className,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
    onClick?: () => void;
    className?: string;
}) => (
    <div
        onClick={onClick}
        className={className}
        style={{
            background: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: "16px 20px",
            cursor: onClick ? "pointer" : "default",
            ...style,
        }}
    >
        {children}
    </div>
);

// ── HEADING ───────────────────────────────────────────────
export const Heading = ({
    children,
    size = "lg",
    style: s = {},
}: {
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    style?: React.CSSProperties;
}) => {
    const sz = { sm: 14, md: 17, lg: 21, xl: 27 };
    return (
        <div
            style={{
                fontFamily: C.display,
                fontWeight: 700,
                fontSize: sz[size],
                color: C.text,
                ...s,
            }}
        >
            {children}
        </div>
    );
};

// ── TAG ───────────────────────────────────────────────────
export const Tag = ({
    children,
    color = "gray",
}: {
    children: React.ReactNode;
    color?: "gray" | "green" | "amber" | "red" | "blue" | "purple";
}) => {
    const m: Record<string, [string, string]> = {
        gray: ["#F3F4F6", "#374151"],
        green: ["#DCFCE7", "#14532D"],
        amber: ["#FEF3C7", "#78350F"],
        red: ["#FEE2E2", "#7F1D1D"],
        blue: ["#DBEAFE", "#1E3A5F"],
        purple: ["#EDE9FE", "#4C1D95"],
    };
    const [bg, fg] = m[color] ?? m.gray;
    return (
        <span
            style={{
                background: bg,
                color: fg,
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
                fontFamily: C.mono,
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </span>
    );
};

// ── BUTTON ────────────────────────────────────────────────
export const Btn = ({
    children,
    onClick,
    variant = "primary",
    size = "md",
    disabled,
    fullWidth,
    type = "button",
    icon: Icon,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "accent" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    fullWidth?: boolean;
    type?: "button" | "submit";
    icon?: React.ElementType;
}) => {
    const bg: Record<string, string> = {
        primary: C.primary,
        accent: C.accent,
        secondary: "transparent",
        danger: C.danger,
        ghost: "transparent",
    };
    const fg: Record<string, string> = {
        primary: "#fff",
        accent: "#fff",
        secondary: C.primary,
        danger: "#fff",
        ghost: C.muted,
    };
    const br: Record<string, string> = {
        secondary: `1.5px solid ${C.primary}`,
    };
    const pd: Record<string, string> = {
        sm: "6px 12px",
        md: "9px 18px",
        lg: "12px 24px",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                background: bg[variant],
                color: fg[variant],
                border: br[variant] ?? "none",
                padding: pd[size],
                borderRadius: 8,
                fontSize: size === "sm" ? 12 : 14,
                fontFamily: C.sans,
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                width: fullWidth ? "100%" : "auto",
                justifyContent: "center",
                transition: "filter 0.12s, transform 0.1s",
            }}
        >
            {Icon && <Icon size={14} />}
            {children}
        </button>
    );
};

// ── FIELD ─────────────────────────────────────────────────
export const Field = ({
    label,
    required,
    children,
    note,
    hint,
    error,
}: {
    label?: string;
    required?: boolean;
    children: React.ReactNode;
    note?: string;
    hint?: string;
    error?: string;
}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {label && (
            <label
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                }}
            >
                {label}
                {required && (
                    <span style={{ color: C.danger }}> *</span>
                )}
            </label>
        )}
        {children}
        {(note || hint) && (
            <span style={{ fontSize: 11, color: C.muted }}>{note ?? hint}</span>
        )}
        {error && (
            <span style={{ fontSize: 11, color: C.danger }}>{error}</span>
        )}
    </div>
);

// ── TEXT INPUT ────────────────────────────────────────────
export const TI = ({
    value,
    onChange,
    placeholder,
    type = "text",
    disabled,
    step,
    min,
    max,
    inputMode,
    onKeyDown,
}: {
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    step?: string;
    min?: string;
    max?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        step={step}
        min={min}
        max={max}
        inputMode={inputMode}
        onKeyDown={onKeyDown}
        style={{
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            padding: "9px 13px",
            fontSize: 14,
            fontFamily: C.sans,
            color: C.text,
            background: disabled ? "#F7F7F7" : "#fff",
            width: "100%",
        }}
    />
);

// ── SELECT INPUT ──────────────────────────────────────────
export const SI = ({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[] | string[];
}) => (
    <select
        value={value}
        onChange={onChange}
        style={{
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            padding: "9px 13px",
            fontSize: 14,
            fontFamily: C.sans,
            color: value ? C.text : C.muted,
            background: "#fff",
            width: "100%",
        }}
    >
        <option value="">Select...</option>
        {options.map(o => {
            const val = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label;
            return (
                <option key={val} value={val}>
                    {lbl}
                </option>
            );
        })}
    </select>
);

// ── TEXTAREA ──────────────────────────────────────────────
export const TA = ({
    value,
    onChange,
    placeholder,
    rows = 3,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
}) => (
    <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            padding: "9px 13px",
            fontSize: 14,
            fontFamily: C.sans,
            color: C.text,
            background: "#fff",
            width: "100%",
            resize: "vertical",
        }}
    />
);

// ── ALERT BOX ─────────────────────────────────────────────
export const AlertBox = ({
    type = "warning",
    children,
}: {
    type?: "warning" | "error" | "success";
    children: React.ReactNode;
}) => {
    const m: Record<string, [string, string, string]> = {
        warning: ["#FFFBEB", "#92400E", C.warning],
        error: ["#FFF1F1", "#7F1D1D", C.danger],
        success: ["#F0FDF4", "#14532D", C.success],
    };
    const [bg, fg, ic] = m[type] ?? m.warning;
    return (
        <div
            style={{
                background: bg,
                border: `1px solid ${ic}40`,
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
            }}
        >
            <AlertTriangle
                size={15}
                color={ic}
                style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: fg, lineHeight: 1.5 }}>
                {children}
            </span>
        </div>
    );
};

// ── SPINNER ───────────────────────────────────────────────
export const Spinner = ({ color = C.primary }: { color?: string }) => (
    <div
        style={{
            width: 20,
            height: 20,
            border: `2px solid ${color}30`,
            borderTop: `2px solid ${color}`,
            borderRadius: "50%",
        }}
        className="spin"
    />
);

// ── CONFIRM BOTTOM SHEET ──────────────────────────────────
export const ConfirmSheet = ({
    title,
    rows,
    onConfirm,
    onCancel,
    confirmLabel = "Confirm & Submit",
    offline,
}: {
    title: string;
    rows: { label: string; value: string }[];
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    offline?: boolean;
}) => (
    <div
        style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
        }}
    >
        <div
            className="slide-up"
            style={{
                background: C.card,
                borderRadius: "16px 16px 0 0",
                padding: "24px 20px",
                width: "100%",
                maxWidth: 480,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                }}
            >
                <Heading size="md">{title}</Heading>
                <button
                    onClick={onCancel}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.muted,
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 20,
                }}
            >
                {rows.map(({ label, value }) => (
                    <div
                        key={label}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            background: C.bg,
                            borderRadius: 8,
                        }}
                    >
                        <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: C.mono,
                                color: C.text,
                            }}
                        >
                            {value}
                        </span>
                    </div>
                ))}
            </div>

            {offline && (
                <div style={{ marginBottom: 12 }}>
                    <AlertBox type="warning">
                        Offline — will sync when connected.
                    </AlertBox>
                </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="secondary" onClick={onCancel} fullWidth>
                    Go Back
                </Btn>
                <Btn onClick={onConfirm} fullWidth>
                    {confirmLabel}
                </Btn>
            </div>
        </div>
    </div>
);

// ── PAGINATOR ─────────────────────────────────────────────
export const Paginator = ({
    page,
    totalPages,
    setPage,
    total,
}: {
    page: number;
    totalPages: number;
    setPage: (p: number) => void;
    total: number;
}) => (
    <div
        style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 16px",
            borderTop: `1px solid ${C.border}`,
        }}
    >
        <span style={{ fontSize: 12, color: C.muted, fontFamily: C.mono }}>
            {total} entries · Page {page}/{totalPages}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
            <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                    background: "none",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "5px 9px",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    color: page === 1 ? C.muted : C.text,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <ChevronLeft size={14} />
            </button>
            <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                    background: "none",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "5px 9px",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    color: page === totalPages ? C.muted : C.text,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <ChevronRight size={14} />
            </button>
        </div>
    </div>
);

// ── FUEL MULTI SELECT ─────────────────────────────────────

export const FuelMultiSelect = ({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) => {
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
                        background: value.includes(f) ? `${C.primary}12` : C.bg,
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
                    <span style={{ fontSize: 13 }}>{f}</span>
                </label>
            ))}
        </div>
    );
};

// ── SUCCESS SCREEN ────────────────────────────────────────
export const SuccessScreen = ({
    title,
    subtitle,
    color = C.success,
    icon: Icon,
}: {
    title: string;
    subtitle?: string;
    color?: string;
    icon?: React.ElementType;
}) => (
    <div
        style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 64,
            flex: 1,
        }}
        className="fade-in"
    >
        <div
            style={{
                background: `${color}18`,
                borderRadius: 50,
                padding: 20,
            }}
        >
            {Icon && <Icon size={42} color={color} />}
        </div>
        <Heading size="lg">{title}</Heading>
        {subtitle && (
            <p
                style={{
                    color: C.muted,
                    fontSize: 13,
                    textAlign: "center",
                }}
            >
                {subtitle}
            </p>
        )}
    </div>
);