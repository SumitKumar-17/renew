import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { compostService } from "./compost.service";
import { CreateCompostSchema } from "@renew-hope/shared";
import { AppError } from "../../utils/AppError";

// GET /compost
export const getCompost = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { from, to } = req.query as {
            from?: string;
            to?: string;
        };

        let logs;

        if (user.role === "admin") {
            logs = await compostService.getAll(from, to);
        } else {
            if (!user.digesterId) {
                throw AppError.forbidden("No digester assigned to this operator");
            }
            logs = await compostService.getByDigester(
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

// POST /compost
export const createCompost = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        // 1. Check operator has a digester
        if (!user.digesterId) {
            throw AppError.forbidden("No digester assigned to this operator");
        }

        // 2. Check photo was uploaded
        if (!req.file) {
            throw AppError.badRequest("Photo of compost bags is required");
        }

        // 3. Parse numeric fields from multipart form
        const body = {
            ...req.body,
            bags: parseInt(req.body.bags),
        };

        // 4. Validate
        const dto = CreateCompostSchema.parse(body);

        // 5. Create
        const log = await compostService.create(
            dto,
            user.digesterId,
            user.id,
            req.file
        );

        res.status(201).json({
            success: true,
            data: log,
            message: `Compost log saved. ${log.bags} bags recorded for ${dto.date}`,
        });
    }
);