"use client";

import React from "react";
import { C } from "@/lib/utils/tokens";
import { AlertTriangle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { FUEL_OPTIONS } from "@renew-hope/shared";

// ── CARD ──────────────────────────────────────────────────
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
        <div style={{ fontFamily: C.display, fontWeight: 700, fontSize: sz[size], color: C.text, ...s }}>
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
        gray:   ["#F3F4F6", "#374151"],
        green:  ["#DCFCE7", "#14532D"],
        amber:  ["#FEF3C7", "#78350F"],
        red:    ["#FEE2E2", "#7F1D1D"],
        blue:   ["#DBEAFE", "#1E3A5F"],
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

// ── BTN ───────────────────────────────────────────────────
export const Btn = ({
    children,
    onClick,
    variant = "primary",
    size = "md",
    disabled = false,
    fullWidth = false,
    icon: Icon,
    style: s = {},
}: {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "accent" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: React.ElementType;
    style?: React.CSSProperties;
}) => {
    const bg: Record<string, string> = {
        primary: C.primary, accent: C.accent, danger: C.danger,
        secondary: "transparent", ghost: "transparent",
    };
    const fg: Record<string, string> = {
        primary: "#fff", accent: "#fff", danger: "#fff",
        secondary: C.primary, ghost: C.muted,
    };
    const border: Record<string, string> = {
        primary: "none", accent: "none", danger: "none",
        secondary: `1.5px solid ${C.primary}`, ghost: "none",
    };
    const pad = { sm: "6px 12px", md: "9px 18px", lg: "12px 24px" };
    const fs = { sm: 12, md: 13, lg: 15 };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                background: bg[variant],
                color: fg[variant],
                border: border[variant],
                borderRadius: 8,
                padding: pad[size],
                fontSize: fs[size],
                fontWeight: 600,
                fontFamily: C.sans,
                width: fullWidth ? "100%" : "auto",
                opacity: disabled ? 0.5 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                ...s,
            }}
        >
            {Icon && <Icon size={size === "sm" ? 13 : 15} />}
            {children}
        </button>
    );
};

// ── FIELD ─────────────────────────────────────────────────
export const Field = ({
    label,
    required,
    note,
    children,
}: {
    label: string;
    required?: boolean;
    note?: string;
    children: React.ReactNode;
}) => (
    <div>
        <label
            style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontFamily: C.sans,
                display: "block",
                marginBottom: 6,
            }}
        >
            {label}{required && " *"}{note && <span style={{ color: C.muted, textTransform: "none" }}> — {note}</span>}
        </label>
        {children}
    </div>
);

// ── TI — Text Input ───────────────────────────────────────
export const TI = ({
    value,
    onChange,
    onKeyDown,
    placeholder,
    type = "text",
    min,
    max,
    step,
    disabled,
    style: s = {},
}: {
    value: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    min?: string;
    max?: string;
    step?: string;
    disabled?: boolean;
    style?: React.CSSProperties;
}) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        style={{
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            padding: "9px 13px",
            fontSize: 14,
            fontFamily: C.sans,
            color: C.text,
            background: disabled ? C.bg : "#fff",
            width: "100%",
            outline: "none",
            minWidth: 0,
            ...s,
        }}
    />
);

// ── SI — Select Input ─────────────────────────────────────
export const SI = ({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
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
            outline: "none",
            minWidth: 0,
        }}
    >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
        ))}
    </select>
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
        error:   ["#FFF1F1", "#7F1D1D", C.danger],
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
            <AlertTriangle size={15} color={ic} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: fg, lineHeight: 1.5 }}>{children}</span>
        </div>
    );
};

// ── THEAD ─────────────────────────────────────────────────
export const THead = ({ cols }: { cols: string[] }) => (
    <thead>
        <tr>
            {cols.map(c => (
                <th
                    key={c}
                    style={{
                        background: C.bg,
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11,
                        color: C.muted,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontFamily: C.sans,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                    }}
                >
                    {c}
                </th>
            ))}
        </tr>
    </thead>
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
            background: C.bg,
        }}
    >
        <span style={{ fontSize: 12, color: C.muted, fontFamily: C.mono }}>
            {total} entries · Page {page}/{Math.max(1, totalPages)}
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
                disabled={page >= totalPages}
                style={{
                    background: "none",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "5px 9px",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    color: page >= totalPages ? C.muted : C.text,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <ChevronRight size={14} />
            </button>
        </div>
    </div>
);

// ── DATE FILTER ───────────────────────────────────────────
export const DateFilter = ({
    from,
    setFrom,
    to,
    setTo,
}: {
    from: string;
    setFrom: (v: string) => void;
    to: string;
    setTo: (v: string) => void;
}) => (
    <div
        style={{
            padding: "12px 16px",
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
        }}
    >
        <div style={{ minWidth: 140 }}>
            <Field label="From">
                <TI type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </Field>
        </div>
        <div style={{ minWidth: 140 }}>
            <Field label="To">
                <TI type="date" value={to} onChange={e => setTo(e.target.value)} />
            </Field>
        </div>
        {(from || to) && (
            <Btn size="sm" variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>
                Clear ✕
            </Btn>
        )}
    </div>
);

// ── PHOTO MODAL ───────────────────────────────────────────
export const PhotoModal = ({
    url,
    caption,
    onClose,
}: {
    url: string;
    caption: string;
    onClose: () => void;
}) => (
    <div
        onClick={onClose}
        style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
        }}
    >
        <button
            onClick={onClose}
            style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "#fff2",
                border: "none",
                color: "#fff",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <X size={18} />
        </button>
        <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={url} alt={caption} style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8, display: "block" }} />
            <div style={{ color: "#fff9", fontSize: 12, textAlign: "center", marginTop: 10 }}>{caption}</div>
        </div>
    </div>
);

// ── PHOTO BTN ─────────────────────────────────────────────
export const PhotoBtn = ({
    url,
    caption,
    setModal,
}: {
    url?: string | null;
    caption: string;
    setModal: (v: { url: string; caption: string } | null) => void;
}) => {
    if (!url) return <Tag color="red">✗ No photo</Tag>;
    return (
        <button
            onClick={() => setModal({ url, caption })}
            style={{
                background: C.success + "18",
                color: C.success,
                border: `1px solid ${C.success}40`,
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: C.mono,
                cursor: "pointer",
                whiteSpace: "nowrap",
            }}
        >
            📷 View
        </button>
    );
};

// ── FUEL MULTI SELECT ─────────────────────────────────────
export const FuelMultiSelect = ({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) => {
    const toggle = (f: string) => {
        onChange(value.includes(f) ? value.filter(x => x !== f) : [...value, f]);
    };
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
                        style={{ accentColor: C.primary, width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 13 }}>{f}</span>
                </label>
            ))}
        </div>
    );
};
