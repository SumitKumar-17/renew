import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { householdService } from "./household.service";
import { CreateHouseholdSchema } from "@renew-hope/shared";
import { AppError } from "../../utils/AppError";

// GET /households
// Operator → gets their digester's households
// Admin    → gets all households
export const getHouseholds = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        let households;

        if (user.role === "admin") {
            households = await householdService.getAll();
        } else {
            // Operator must have a digesterId
            if (!user.digesterId) {
                throw AppError.forbidden("No digester assigned to this operator");
            }
            households = await householdService.getByDigester(user.digesterId);
        }

        res.status(200).json({
            success: true,
            data: households,
        });
    }
);

// GET /households/:id
export const getHouseholdById = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        if (!user.digesterId) {
            throw AppError.forbidden("No digester assigned to this operator");
        }

        const household = await householdService.getById(id, user.digesterId);

        res.status(200).json({
            success: true,
            data: household,
        });
    }
);

// POST /households
export const createHousehold = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        // Admin passes digesterId in body; operator uses their own
        let digesterId: string;
        if (user.role === "admin") {
            digesterId = req.body.digesterId;
            if (!digesterId) {
                throw AppError.badRequest("digesterId is required for admin");
            }
        } else {
            if (!user.digesterId) {
                throw AppError.forbidden("No digester assigned to this operator");
            }
            digesterId = user.digesterId;
        }

        // Validate body (digesterId is stripped out by Zod — schema doesn't include it)
        const dto = CreateHouseholdSchema.parse(req.body);

        const household = await householdService.create(dto, digesterId);

        res.status(201).json({
            success: true,
            data: household,
            message: "Household registered successfully",
        });
    }
);