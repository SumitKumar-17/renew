import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { feedstockService } from "./feedstock.service";
import { CreateFeedstockSchema } from "@renew-hope/shared";
import { AppError } from "../../utils/AppError";

// GET /feedstock
export const getFeedstock = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { from, to } = req.query as {
            from?: string;
            to?: string;
        };

        let logs;

        if (user.role === "admin") {
            logs = await feedstockService.getAll(from, to);
        } else {
            if (!user.digesterId) {
                throw AppError.forbidden("No digester assigned to this operator");
            }
            logs = await feedstockService.getByDigester(
                user.digesterId,
                from,
                to
            );
        }

        res.status(200).json({
            success: true,
            data: logs,
        });
    }
);

// POST /feedstock
export const createFeedstock = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        // 1. Check operator has a digester
        if (!user.digesterId) {
            throw AppError.forbidden("No digester assigned to this operator");
        }

        // 2. Check photo was uploaded
        console.log(`[feedstock] req.file =`, req.file ? `${req.file.originalname} (${req.file.size}b)` : "MISSING");
        console.log(`[feedstock] req.body =`, req.body);
        if (!req.file) {
            throw AppError.badRequest("Photo is required");
        }

        // 3. Parse numeric fields from multipart form
        //    multipart sends everything as strings — convert before Zod
        const body = {
            ...req.body,
            weight: parseFloat(req.body.weight),
            waterLitres: req.body.waterLitres
                ? parseFloat(req.body.waterLitres)
                : 0,
        };

        // 4. Validate
        console.log(`[feedstock] parsed body =`, body);
        const dto = CreateFeedstockSchema.parse(body);

        // 5. Create
        const log = await feedstockService.create(
            dto,
            user.digesterId,
            user.id,
            req.file
        );

        res.status(201).json({
            success: true,
            data: log,
            message: "Feedstock log submitted successfully",
        });
    }
);