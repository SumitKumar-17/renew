"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { C } from "@/lib/utils/tokens";

export const PhotoUploader = ({
    photo,
    photoName,
    onPhotoChange,
    accentColor = C.success,
    label = "Photo",
}: {
    photo?: string | null;
    photoName?: string;
    onPhotoChange: (file: File, preview: string) => void;
    accentColor?: string;
    label?: string;
}) => {
    const fileRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        onPhotoChange(file, preview);
    };

    return (
        <div
            onClick={() => fileRef.current?.click()}
            style={{
                border: `2px dashed ${photo ? accentColor : C.border}`,
                borderRadius: 10,
                padding: 24,
                textAlign: "center",
                cursor: "pointer",
                background: photo ? `${accentColor}08` : "#FAFAF9",
                transition: "all 0.2s",
            }}
        >
            {photo ? (
                <div>
                    <img
                        src={photo}
                        alt="preview"
                        style={{
                            maxHeight: 160,
                            maxWidth: "100%",
                            borderRadius: 8,
                            marginBottom: 8,
                            objectFit: "cover",
                        }}
                    />
                    <div
                        style={{
                            fontSize: 12,
                            color: accentColor,
                            fontFamily: C.mono,
                        }}
                    >
                        {photoName}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: C.muted,
                            marginTop: 4,
                        }}
                    >
                        Tap to change
                    </div>
                </div>
            ) : (
                <div>
                    <Upload
                        size={28}
                        color={C.muted}
                        style={{ marginBottom: 8 }}
                    />
                    <div style={{ fontSize: 14, color: C.muted }}>
                        Tap to take photo or upload
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: C.muted,
                            marginTop: 4,
                        }}
                    >
                        {label} required for audit record
                    </div>
                </div>
            )}
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleChange}
                style={{ display: "none" }}
            />
        </div>
    );
};