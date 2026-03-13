export const FUEL_OPTIONS = [
    "LPG (Cooking Gas)",
    "Firewood",
    "Kerosene",
    "Charcoal",
    "Cow Dung Cake",
    "None / Not Applicable",
] as const;

export type FuelOption = (typeof FUEL_OPTIONS)[number];