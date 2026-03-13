import { z } from "zod";
import { FEEDSTOCK_TYPES } from "../constants/feedstockTypes";

export const CreateFeedstockSchema = z.object({
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  weight:      z.number().positive("Weight must be positive"),
  waterLitres: z.number().min(0).default(0),
  type:        z.enum(FEEDSTOCK_TYPES),
  notes:       z.string().optional(),
});

export type CreateFeedstockDto = z.infer<typeof CreateFeedstockSchema>;