import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { distributionService } from "./distribution.service";
import { CreateDistributionSchema } from "@renew-hope/shared";
import { AppError } from "../../utils/AppError";

// GET /distribution
export const getDistribution = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { from, to } = req.query as {
            from?: string;
            to?: string;
        };

        let records;

        if (user.role === "admin") {
            records = await distributionService.getAll(from, to);
        } else {
            if (!user.digesterId) {
                throw AppError.forbidden("No digester assigned to this operator");
            }
            records = await distributionService.getByDigester(
                user.digesterId,
                from,
                to
            );
        }

        res.status(200).json({
            success: true,
            data: records,
        });
    }
);

// GET /distribution/balance
// Returns gas balance for operator's digester
export const getBalance = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        if (!user.digesterId) {
            throw AppError.forbidden("No digester assigned to this operator");
        }

        const balance = await distributionService.getBalance(user.digesterId);

        res.status(200).json({
            success: true,
            data: balance,
        });
    }
);

// POST /distribution
export const createDistribution = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        if (!user.digesterId) {
            throw AppError.forbidden("No digester assigned to this operator");
        }

        // Validate body
        const dto = CreateDistributionSchema.parse(req.body);

        const result = await distributionService.create(
            dto,
            user.digesterId,
            user.id
        );

        res.status(201).json({
            success: true,
            data: result,
            message: `Gas distributed to ${result.summary.householdsServed} households. Remaining surplus: ${result.summary.remainingSurplus} m³`,
        });
    }
);