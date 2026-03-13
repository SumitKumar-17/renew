export default function FeedstockLoading() {
    const shimmer = {
        background: "linear-gradient(90deg, #E4DFD5 25%, #F4F0E8 50%, #E4DFD5 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        borderRadius: 8,
    } as React.CSSProperties;

    return (
        <>
            <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

            {/* Header skeleton */}
            <div style={{ background: "#1B3829", padding: "16px 20px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <div style={{ ...shimmer, width: 34, height: 34, borderRadius: 8, opacity: 0.3 }} />
                    <div style={{ ...shimmer, width: 140, height: 22, opacity: 0.3 }} />
                </div>
                <div style={{ ...shimmer, width: 200, height: 14, marginLeft: 46, opacity: 0.2 }} />
            </div>

            <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{
                            background: "#fff",
                            borderRadius: 14,
                            border: "1.5px solid #E4DFD5",
                            overflow: "hidden",
                        }}
                    >
                        {/* Section header */}
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F4F0E8" }}>
                            <div style={{ ...shimmer, width: 100, height: 16 }} />
                        </div>
                        {/* Section body */}
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <div style={{ ...shimmer, width: 80, height: 12, marginBottom: 6 }} />
                                <div style={{ ...shimmer, width: "100%", height: 44 }} />
                            </div>
                            {i < 3 && (
                                <div>
                                    <div style={{ ...shimmer, width: 120, height: 12, marginBottom: 6 }} />
                                    <div style={{ ...shimmer, width: "100%", height: 44 }} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Button skeleton */}
                <div style={{ ...shimmer, width: "100%", height: 52, borderRadius: 12 }} />
            </div>
        </>
    );
}