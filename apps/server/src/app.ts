// trigger nodemon restart
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { logger } from "./config/logger";
import authRoutes from "./modules/auth/auth.routes";
import householdRoutes from "./modules/households/household.routes";
import feedstockRoutes from "./modules/feedstock/feedstock.routes";
import meterRoutes from "./modules/meter/meter.routes";
import distributionRoutes from "./modules/distribution/distribution.routes";
import compostRoutes from "./modules/compost/compost.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import syncRoutes from "./modules/sync/sync.routes";
import digesterRoutes from "./modules/digesters/digester.routes";
import operatorRoutes from "./modules/operators/operators.routes";
import reportRoutes from "./modules/reports/reports.routes";


export const createApp = () => {
    const app = express();

    // ── Security
    app.use(helmet());

    // ── CORS
    app.use(cors({
        origin: [env.OPERATOR_APP_URL, env.ADMIN_APP_URL],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));

    // ── Body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // ── HTTP request logging
    app.use(morgan("dev", {
        stream: {
            write: (message: string) => logger.http(message.trim()),
        },
    }));

    // ── Health check
    app.get("/health", (req, res) => {
        res.json({
            success: true,
            message: "Renew Hope API is running",
            env: env.NODE_ENV,
        });
    });

    // ── Routes will be added here soon
    app.use("/auth", authRoutes);
    app.use("/households", householdRoutes);
    app.use("/feedstock", feedstockRoutes);
    app.use("/meter", meterRoutes);
    app.use("/distribution", distributionRoutes);
    app.use("/compost", compostRoutes);
    app.use("/dashboard", dashboardRoutes);
    app.use("/sync", syncRoutes);
    app.use("/digesters",    digesterRoutes);
    app.use("/operators",    operatorRoutes);
    app.use("/reports",      reportRoutes);

    // ── 404 and error handlers — always last
    app.use(notFound);
    app.use(errorHandler);

    return app;
};