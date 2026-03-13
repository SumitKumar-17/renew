import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { logger } from "../config/logger";
import { env } from "../config/env";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    // 1. Zod validation errors
    if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
        }));
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
        return;
    }

    // 2. Known operational errors (AppError)
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // 3. Prisma known errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const prismaErr = err as Prisma.PrismaClientKnownRequestError;
        // Unique constraint violation
        if (prismaErr.code === "P2002") {
            res.status(409).json({
                success: false,
                message: "A record with this value already exists",
            });
            return;
        }
        // Record not found
        if (prismaErr.code === "P2025") {
            res.status(404).json({
                success: false,
                message: "Record not found",
            });
            return;
        }
    }

    // 4. Unknown / unexpected errors
    logger.error("Unexpected error:", {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
    });

    res.status(500).json({
        success: false,
        message: "Something went wrong",
        // Only show stack trace in development
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
    });
};