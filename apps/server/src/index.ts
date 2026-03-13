import { createApp } from "./app";
import { prisma } from "./config/database";
import { logger } from "./config/logger";
import { env } from "./config/env";

const start = async () => {
    // 1. Test database connection
    try {
        await prisma.$connect();
        logger.info("✅ Database connected");
    } catch (err) {
        logger.error("❌ Database connection failed:", err);
        process.exit(1);
    }

    // 2. Create and start Express app
    const app = createApp();

    const server = app.listen(env.PORT, () => {
        logger.info(`✅ Server running on port ${env.PORT}`);
        logger.info(`   Environment : ${env.NODE_ENV}`);
        logger.info(`   Health check: http://localhost:${env.PORT}/health`);
    });

    // 3. Graceful shutdown
    const shutdown = async (signal: string) => {
        logger.info(`${signal} received — shutting down gracefully`);
        server.close(async () => {
            await prisma.$disconnect();
            logger.info("Database disconnected");
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};

start();