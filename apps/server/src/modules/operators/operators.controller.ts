import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { operatorsService } from "./operators.service";
import { AppError } from "../../utils/AppError";

// GET /operators
export const getOperators = asyncHandler(async (req: Request, res: Response) => {
    const operators = await operatorsService.getAll();
    res.json({ success: true, data: operators });
});

// POST /operators
export const createOperator = asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, password, digesterId } = req.body;

    if (!name || !phone || !password) {
        throw AppError.badRequest("name, phone, and password are required");
    }

    const operator = await operatorsService.create({ name, phone, password, digesterId });
    res.status(201).json({
        success: true,
        data: operator,
        message: `Operator ${operator.id} created`,
    });
});

// PATCH /operators/:id/status
export const updateOperatorStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
        throw AppError.badRequest("status must be active or inactive");
    }

    const op = await operatorsService.updateStatus(id, status);
    res.json({ success: true, data: op });
});
