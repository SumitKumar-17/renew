import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
    // Server
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("4000"),

    // Database
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    // JWT
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    // AWS S3
    AWS_REGION: z.string().min(1, "AWS_REGION is required"),
    AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
    AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
    S3_BUCKET_NAME: z.string().min(1, "S3_BUCKET_NAME is required"),

    // CORS
    OPERATOR_APP_URL: z.string().url("Must be a valid URL"),
    ADMIN_APP_URL: z.string().url("Must be a valid URL"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    parsed.error.errors.forEach(err => {
        console.error(`   ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
}

export const env = parsed.data;