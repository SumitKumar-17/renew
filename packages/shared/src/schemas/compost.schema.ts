import { z } from "zod";

export const CreateCompostSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    bags: z.number().int().positive(),
    notes: z.string().optional(),
});

export type CreateCompostDto = z.infer<typeof CreateCompostSchema>;