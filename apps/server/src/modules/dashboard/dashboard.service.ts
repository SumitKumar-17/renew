import { prisma } from "../../config/database";
import { meterService } from "../meter/meter.service";
import { distributionService } from "../distribution/distribution.service";
import { compostService } from "../compost/compost.service";

export const dashboardService = {

    getSummary: async (digesterId: string) => {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
        const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

        // ── Run all queries in parallel for performance
        const [
            digester,
            householdCount,
            lastMeterReading,
            gasBalance,
            totalCompostBags,
            todayFeedstock,
            todayMeter,
            recentFeedstock,
            recentMeter,
            recentDistribution,
            recentCompost,
            last14DaysReadings,
        ] = await Promise.all([

            // Digester info
            prisma.digester.findUnique({
                where: { id: digesterId },
            }),

            // Total households
            prisma.household.count({
                where: { digesterId },
            }),

            // Last meter reading
            meterService.getLastReading(digesterId),

            // Gas balance
            distributionService.getBalance(digesterId),

            // Total compost bags
            compostService.getTotalBags(digesterId),

            // Did operator log feedstock today?
            prisma.feedstockLog.findFirst({
                where: {
                    digesterId,
                    date: { gte: todayStart, lte: todayEnd },
                },
            }),

            // Did operator log meter today?
            prisma.flowMeterReading.findFirst({
                where: {
                    digesterId,
                    date: { gte: todayStart, lte: todayEnd },
                },
            }),

            // Recent feedstock logs
            prisma.feedstockLog.findMany({
                where: { digesterId },
                orderBy: { date: "desc" },
                take: 3,
            }),

            // Recent meter readings
            prisma.flowMeterReading.findMany({
                where: { digesterId },
                orderBy: { date: "desc" },
                take: 3,
            }),

            // Recent distribution
            prisma.gasDistribution.findMany({
                where: { digesterId },
                orderBy: { date: "desc" },
                take: 3,
                include: {
                    household: {
                        select: { headName: true },
                    },
                },
            }),

            // Recent compost
            prisma.compostLog.findMany({
                where: { digesterId },
                orderBy: { date: "desc" },
                take: 3,
            }),

            // Last 14 days meter readings for trend
            prisma.flowMeterReading.findMany({
                where: {
                    digesterId,
                    date: {
                        gte: new Date(
                            new Date().setDate(new Date().getDate() - 14)
                        ),
                    },
                },
                orderBy: { date: "asc" },
                select: { date: true, reading: true },
            }),

        ]);

        // ── Today's completion status
        const todayStatus = {
            feedstockLogged: !!todayFeedstock,
            meterLogged: !!todayMeter,
            isComplete: !!todayFeedstock && !!todayMeter,
        };

        // ── Derive daily production for last 14 days
        const gasTrend = last14DaysReadings.map((r, i) => {
            const prev = last14DaysReadings[i - 1];
            return {
                date: r.date.toISOString().split("T")[0],
                dailyProduction: prev
                    ? +(r.reading - prev.reading).toFixed(2)
                    : null,
            };
        }).filter(r => r.dailyProduction !== null);

        // ── Merge recent activity across all modules
        const recentActivity = [
            ...recentFeedstock.map(r => ({
                type: "feedstock" as const,
                date: r.date.toISOString().split("T")[0],
                summary: `${r.type} · ${r.weight} kg`,
                id: r.id,
                synced: true,
            })),
            ...recentMeter.map(r => ({
                type: "meter" as const,
                date: r.date.toISOString().split("T")[0],
                summary: `Meter: ${r.reading} m³`,
                id: r.id,
                synced: true,
            })),
            ...recentDistribution.map(r => ({
                type: "distribution" as const,
                date: r.date.toISOString().split("T")[0],
                summary: `${r.household.headName} · ${r.volume} m³`,
                id: r.id,
                synced: true,
            })),
            ...recentCompost.map(r => ({
                type: "compost" as const,
                date: r.date.toISOString().split("T")[0],
                summary: `${r.bags} bags`,
                id: r.id,
                synced: true,
            })),
        ]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);

        // ── Consecutive days streak
        //    Count how many days in a row had both feedstock + meter logged
        const streak = await dashboardService.getStreak(digesterId);

        return {
            digester: {
                id: digester?.id,
                location: digester?.location,
                status: digester?.status,
            },
            householdCount,
            gasBalance,
            lastMeterReading: lastMeterReading
                ? {
                    reading: lastMeterReading.reading,
                    date: lastMeterReading.date.toISOString().split("T")[0],
                }
                : null,
            totalCompostBags,
            todayStatus,
            gasTrend,
            recentActivity,
            streak,
        };
    },

    // Calculate consecutive days streak
    getStreak: async (digesterId: string): Promise<number> => {
        let streak = 0;
        const check = new Date();

        // Check up to 30 days back
        for (let i = 0; i < 30; i++) {
            const dateStr = check.toISOString().split("T")[0];
            const dateStart = new Date(`${dateStr}T00:00:00.000Z`);
            const dateEnd = new Date(`${dateStr}T23:59:59.999Z`);

            const [feedstock, meter] = await Promise.all([
                prisma.feedstockLog.findFirst({
                    where: {
                        digesterId,
                        date: { gte: dateStart, lte: dateEnd },
                    },
                }),
                prisma.flowMeterReading.findFirst({
                    where: {
                        digesterId,
                        date: { gte: dateStart, lte: dateEnd },
                    },
                }),
            ]);

            // Break streak if either is missing
            if (!feedstock || !meter) break;

            streak++;
            check.setDate(check.getDate() - 1);
        }

        return streak;
    },

};