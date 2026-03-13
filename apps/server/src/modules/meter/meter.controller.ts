import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { meterService } from "./meter.service";
import { CreateMeterReadingSchema } from "@renew-hope/shared";
import { AppError } from "../../utils/AppError";

// GET /meter
export const getMeterReadings = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { from, to } = req.query as {
            from?: string;
            to?: string;
        };

        let readings;

        if (user.role === "admin") {
            readings = await meterService.getAll(from, to);
        } else {
            if (!user.digesterId) {
                throw AppError.forbidden("No digester assigned to this operator");
            }
            readings = await meterService.getByDigester(
                user.digesterId,
                from,
                to
            );
        }

        res.status(200).json({
            success: true,
            data: readings,
        });
    }
);

// GET /meter/last
// Returns the last reading — used by operator app
// to show current meter value on dashboard
export const getLastReading = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        if (!user.digesterId) {
            throw AppError.forbidden("No digester assigned to this operator");
        }

        const reading = await meterService.getLastReading(user.digesterId);

        res.status(200).json({
            success: true,
            data: reading,
        });
    }
);

// POST /meter
export const createMeterReading = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user!;

        // 1. Check operator has a digester
        if (!user.digesterId) {
            throw AppError.forbidden("No digester assigned to this operator");
        }

        // 2. Check photo was uploaded
        if (!req.file) {
            throw AppError.badRequest("Photo of meter display is required");
        }

        // 3. Parse numeric fields from multipart form
        const body = {
            ...req.body,
            reading: parseFloat(req.body.reading),
        };

        // 4. Validate
        const dto = CreateMeterReadingSchema.parse(body);

        // 5. Create
        const reading = await meterService.create(
            dto,
            user.digesterId,
            user.id,
            req.file
        );

        res.status(201).json({
            success: true,
            data: reading,
            message: reading.isFirstReading
                ? "Opening meter reading saved"
                : `Meter reading saved. Today's production: ${reading.dailyProduction} m³`,
        });
    }
);