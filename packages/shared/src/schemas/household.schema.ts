import { z } from "zod";
import { FUEL_OPTIONS } from "../constants/fuelOptions";

export const CreateHouseholdSchema = z.object({
    headName: z.string().min(1, "Name is required"),
    phone: z.string().regex(/^(?:0\d{9}|\+233\d{9})$/, "Must be a valid Ghana phone number"),
    address: z.string().optional(),
    members: z.number().int().positive(),
    fuelReplaced: z.array(z.enum(FUEL_OPTIONS)).min(1, "Select at least one fuel"),
});

export type CreateHouseholdDto = z.infer<typeof CreateHouseholdSchema>;