import { z } from "zod";

export const CreateMeterReadingSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reading: z.number().positive("Reading must be positive"),
    notes: z.string().optional(),
});

export type CreateMeterReadingDto = z.infer<typeof CreateMeterReadingSchema>;