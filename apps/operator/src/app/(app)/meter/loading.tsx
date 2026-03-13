export default function MeterLoading() {
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

            {/* Heading skeleton */}
            <div style={{ marginBottom: 4 }}>
                <div style={{ ...shimmer, width: 200, height: 28, marginBottom: 8 }} />
                <div style={{ ...shimmer, width: 260, height: 14 }} />
            </div>

            {/* Last reading card skeleton */}
            <div style={{ background: "#1B3829", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {[1, 2].map(i => (
                        <div key={i}>
                            <div style={{ ...shimmer, width: 90, height: 10, marginBottom: 8, opacity: 0.3 }} />
                            <div style={{ ...shimmer, width: 110, height: 24, marginBottom: 6, opacity: 0.3 }} />
                            <div style={{ ...shimmer, width: 80, height: 11, opacity: 0.2 }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Form card skeleton */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4DFD5", padding: "16px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {[1, 2].map(i => (
                            <div key={i}>
                                <div style={{ ...shimmer, width: 60, height: 12, marginBottom: 6 }} />
                                <div style={{ ...shimmer, width: "100%", height: 42 }} />
                            </div>
                        ))}
                    </div>
                    <div>
                        <div style={{ ...shimmer, width: 180, height: 12, marginBottom: 6 }} />
                        <div style={{ ...shimmer, width: "100%", height: 42 }} />
                        <div style={{ ...shimmer, width: 240, height: 11, marginTop: 6 }} />
                    </div>
                    <div>
                        <div style={{ ...shimmer, width: 140, height: 12, marginBottom: 6 }} />
                        <div style={{ ...shimmer, width: "100%", height: 120, borderRadius: 10 }} />
                    </div>
                    <div>
                        <div style={{ ...shimmer, width: 60, height: 12, marginBottom: 6 }} />
                        <div style={{ ...shimmer, width: "100%", height: 80 }} />
                    </div>
                    <div style={{ ...shimmer, width: "100%", height: 48, borderRadius: 8 }} />
                </div>
            </div>
        </>
    );
}
