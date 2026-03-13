export const FEEDSTOCK_TYPES = [
    "Kitchen Waste",
    "Animal Dung (Cow)",
    "Animal Dung (Pig)",
    "Crop Residue",
    "Market Waste",
    "Mixed Organic",
] as const;

export type FeedstockType = (typeof FEEDSTOCK_TYPES)[number];