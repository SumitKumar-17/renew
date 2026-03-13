import winston from "winston";
import { env } from "./env";

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length
        ? `\n${JSON.stringify(meta, null, 2)}`
        : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
});

export const logger = winston.createLogger({
    level: env.NODE_ENV === "development" ? "debug" : "info",
    format: env.NODE_ENV === "development"
        ? combine(
            colorize(),
            timestamp({ format: "HH:mm:ss" }),
            devFormat
        )
        : combine(
            timestamp(),
            json()
        ),
    transports: [
        new winston.transports.Console(),
    ],
});