import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/AppError";

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
): void => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(
            new AppError("Only JPEG, PNG and WebP images are allowed", 400)
        );
    }
};

// Store in memory — we upload to S3 immediately
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
});