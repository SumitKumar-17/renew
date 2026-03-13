import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(AppError.unauthorized("Not authenticated"));
            return;
        }

        if (!roles.includes(req.user.role)) {
            next(AppError.forbidden("You do not have permission to do this"));
            return;
        }

        next();
    };
};