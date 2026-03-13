import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { syncService } from "./sync.service";
import { AppError } from "../../utils/AppError";

// POST /sync/batch
export const syncBatch = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        if (!user.digesterId) {
            throw AppError.forbidden("No digester assigned to this operator");
        }

        // Items come as JSON string in multipart body
        // because we also need to accept photo files
        let items;
        try {
            items = JSON.parse(req.body.items);
        } catch {
            throw AppError.badRequest("Invalid items format — must be JSON string");
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw AppError.badRequest("Items must be a non-empty array");
        }

        // Max batch size — prevent abuse
        if (items.length > 50) {
            throw AppError.badRequest("Maximum 50 items per batch");
        }

        const photos = (req.files as Express.Multer.File[]) || [];

        const results = await syncService.processBatch(
            items,
            user.digesterId,
            user.id,
            photos
        );

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        res.status(200).json({
            success: true,
            data: results,
            message: `Sync complete. ${succeeded} succeeded, ${failed} failed`,
        });
    }
);