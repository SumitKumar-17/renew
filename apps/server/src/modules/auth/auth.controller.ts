import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";
import { LoginSchema } from "@renew-hope/shared";

export const login = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const dto = LoginSchema.parse(req.body);

    // Call service
    const result = await authService.login(dto);

    res.status(200).json({
        success: true,
        data: result,
        message: "Login successful",
    });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(400).json({
            success: false,
            message: "Refresh token is required",
        });
        return;
    }

    const result = await authService.refresh(refreshToken);

    res.status(200).json({
        success: true,
        data: result,
        message: "Token refreshed",
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    // Stateless JWT — client deletes token from IndexedDB
    // Server just confirms
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    // req.user is set by authenticate middleware
    res.status(200).json({
        success: true,
        data: req.user,
    });
});