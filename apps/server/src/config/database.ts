import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const client = new PrismaClient({
        log: [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
        ],
    });

    // Log all queries in development
    client.$on("query", (e) => {
        logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
    });

    client.$on("error", (e) => {
        // Ignore harmless Neon DB idle connection drops since Prisma will automatically recover
        if (e.message.includes("Error { kind: Closed, cause: None }")) {
            return;
        }
        logger.error(`Prisma error: ${e.message}`);
    });

    client.$on("warn", (e) => {
        logger.warn(`Prisma warning: ${e.message}`);
    });

    return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;