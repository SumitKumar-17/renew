import { z } from "zod";

export const CreateDistributionSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
    items: z.array(z.object({
        householdId: z.string().min(1),
        volume: z.number().positive(),
    })).min(1, "At least one household required"),
});

export type CreateDistributionDto = z.infer<typeof CreateDistributionSchema>;