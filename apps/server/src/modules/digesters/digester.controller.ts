import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { digesterService } from "./digester.service";
import { AppError } from "../../utils/AppError";

// GET /digesters
export const getDigesters = asyncHandler(async (req: Request, res: Response) => {
    const digesters = await digesterService.getAll();
    res.json({ success: true, data: digesters });
});

// GET /digesters/:id
export const getDigesterById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const digester = await digesterService.getById(id);
    res.json({ success: true, data: digester });
});

// POST /digesters
export const createDigester = asyncHandler(async (req: Request, res: Response) => {
    const { id, location, installedDate } = req.body;

    if (!id || !location || !installedDate) {
        throw AppError.badRequest("id, location, and installedDate are required");
    }

    const digester = await digesterService.create({ id, location, installedDate });
    res.status(201).json({
        success: true,
        data: digester,
        message: "Digester registered",
    });
});

// PATCH /digesters/:id/status
export const updateDigesterStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "maintenance"].includes(status)) {
        throw AppError.badRequest("status must be active, inactive, or maintenance");
    }

    const digester = await digesterService.updateStatus(id, status);
    res.json({ success: true, data: digester });
});
