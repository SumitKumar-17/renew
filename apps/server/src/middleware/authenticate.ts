import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw AppError.unauthorized("No token provided");
        }

        const token = authHeader.split(" ")[1];

        // Verify and decode
        const payload = verifyAccessToken(token);

        // Check account is still active
        if (payload.status !== "active") {
            throw AppError.forbidden("Account has been deactivated");
        }

        // Attach to request
        req.user = {
            id: payload.id,
            name: payload.name,
            role: payload.role as "admin" | "operator",
            status: payload.status,
            digesterId: payload.digesterId,
        };

        next();
    } catch (err: any) {
        // JWT specific errors
        if (err.name === "TokenExpiredError") {
            next(AppError.unauthorized("Token expired"));
            return;
        }
        if (err.name === "JsonWebTokenError") {
            next(AppError.unauthorized("Invalid token"));
            return;
        }
        next(err);
    }
};