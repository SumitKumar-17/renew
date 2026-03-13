/**
 * Trims a UUID/cuid to a short reference code for display.
 * "a4f8b2c3-1234-..." → "#A4F8B2C3"
 * Falls through gracefully for already-short IDs (e.g. "HH-001").
 */
export function shortId(id: string): string {
    if (!id) return "—";
    // If it already looks like a human ID (HH-001, OP-003 etc.) keep as-is
    if (/^[A-Z]{1,4}-\d+$/i.test(id)) return id.toUpperCase();
    // Otherwise take first 8 hex chars (strip hyphens first)
    const stripped = id.replace(/-/g, "");
    return "#" + stripped.slice(0, 8).toUpperCase();
}
