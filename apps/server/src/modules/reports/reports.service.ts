import { prisma } from "../../config/database";

const getLast14Days = () => {
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
    }
    return days;
};

export const reportsService = {

    getOverview: async () => {
        const [
            digesters,
            operators,
            householdCount,
            feedstockAgg,
            compostAgg,
            meterReadings,
            distributions,
            households,
        ] = await Promise.all([
            prisma.digester.findMany({
                include: {
                    user: { select: { id: true, name: true } },
                    _count: { select: { households: true } },
                },
                orderBy: { createdAt: "asc" },
            }),
            prisma.user.count({ where: { role: "operator" } }),
            prisma.household.count(),
            prisma.feedstockLog.aggregate({ _sum: { weight: true }, _count: true }),
            prisma.compostLog.aggregate({ _sum: { bags: true } }),
            prisma.flowMeterReading.findMany({
                orderBy: [{ digesterId: "asc" }, { date: "asc" }],
                select: { id: true, digesterId: true, date: true, reading: true },
            }),
            prisma.gasDistribution.aggregate({ _sum: { volume: true } }),
            prisma.household.findMany({
                select: { id: true, fuelReplaced: true },
            }),
        ]);

        // Calculate total gas produced per digester (last - first meter reading)
        const gasPerDigester: Record<string, number> = {};
        const metersByDigester = meterReadings.reduce((acc, r) => {
            if (!acc[r.digesterId]) acc[r.digesterId] = [];
            acc[r.digesterId].push(r);
            return acc;
        }, {} as Record<string, typeof meterReadings>);

        let totalGasProduced = 0;
        for (const [digesterId, readings] of Object.entries(metersByDigester)) {
            if (readings.length >= 2) {
                const produced = +(readings[readings.length - 1].reading - readings[0].reading).toFixed(2);
                gasPerDigester[digesterId] = produced;
                totalGasProduced += produced;
            } else {
                gasPerDigester[digesterId] = 0;
            }
        }

        // Fuel displacement
        const fuelCount: Record<string, number> = {};
        for (const hh of households) {
            for (const fuel of hh.fuelReplaced) {
                fuelCount[fuel] = (fuelCount[fuel] ?? 0) + 1;
            }
        }

        const totalDistributed = +(distributions._sum.volume ?? 0).toFixed(2);

        return {
            stats: {
                digesterCount: digesters.length,
                operatorCount: operators,
                householdCount,
                totalGasProduced: +totalGasProduced.toFixed(1),
                totalFeedstockKg: +(feedstockAgg._sum.weight ?? 0).toFixed(1),
                totalCompostBags: compostAgg._sum.bags ?? 0,
                totalDistributed,
                surplus: +(totalGasProduced - totalDistributed).toFixed(2),
                anomalyCount: 0, // computed in charts
                unassignedDigesters: digesters.filter(d => !d.user).length,
            },
            digesters: digesters.map(d => ({
                id: d.id,
                location: d.location,
                status: d.status,
                operatorId: d.user?.id ?? null,
                operatorName: d.user?.name ?? null,
                householdCount: d._count.households,
                gasProduced: gasPerDigester[d.id] ?? 0,
            })),
            fuelDisplacement: fuelCount,
        };
    },

    getCharts: async () => {
        const last14 = getLast14Days();

        const [feedstockLogs, meterReadings, distributions, compostLogs] =
            await Promise.all([
                prisma.feedstockLog.findMany({
                    where: {
                        date: { gte: new Date(`${last14[0]}T00:00:00.000Z`) },
                    },
                    select: { date: true, weight: true, type: true, digesterId: true },
                }),
                prisma.flowMeterReading.findMany({
                    orderBy: [{ digesterId: "asc" }, { date: "asc" }],
                    select: { id: true, digesterId: true, date: true, reading: true },
                }),
                prisma.gasDistribution.findMany({
                    where: {
                        date: { gte: new Date(`${last14[0]}T00:00:00.000Z`) },
                    },
                    select: { date: true, volume: true, digesterId: true },
                }),
                prisma.compostLog.findMany({
                    where: {
                        date: { gte: new Date(`${last14[0]}T00:00:00.000Z`) },
                    },
                    select: { date: true, bags: true, digesterId: true },
                }),
            ]);

        // Gas production trend (last 14 days) — derive daily deltas per digester
        const metersByDigester: Record<string, Array<{ date: string; reading: number }>> = {};
        for (const r of meterReadings) {
            const dateStr = r.date.toISOString().split("T")[0];
            if (!metersByDigester[r.digesterId]) metersByDigester[r.digesterId] = [];
            metersByDigester[r.digesterId].push({ date: dateStr, reading: r.reading });
        }

        // Daily gas by date (sum across all digesters)
        const dailyGas: Record<string, number> = {};
        for (const readings of Object.values(metersByDigester)) {
            for (let i = 1; i < readings.length; i++) {
                const delta = +(readings[i].reading - readings[i - 1].reading).toFixed(2);
                if (delta >= 0) {
                    const d = readings[i].date;
                    dailyGas[d] = (dailyGas[d] ?? 0) + delta;
                }
            }
        }

        const gasTrend = last14.map(d => ({
            date: d.slice(5), // MM-DD
            volume: +(dailyGas[d] ?? 0).toFixed(1),
        }));

        // Feedstock trend
        const fsTrend = last14.map(d => ({
            date: d.slice(5),
            kg: +feedstockLogs
                .filter(r => r.date.toISOString().split("T")[0] === d)
                .reduce((s, r) => s + r.weight, 0)
                .toFixed(0),
        }));

        // Feedstock by type (all time)
        const allFeedstock = await prisma.feedstockLog.findMany({
            select: { type: true, weight: true },
        });
        const fsByType: Record<string, number> = {};
        for (const r of allFeedstock) {
            fsByType[r.type] = (fsByType[r.type] ?? 0) + r.weight;
        }
        const feedstockByType = Object.entries(fsByType).map(([name, value]) => ({
            name,
            value: +value.toFixed(1),
        }));

        // Compost trend
        const compostTrend = last14.map(d => ({
            date: d.slice(5),
            bags: compostLogs
                .filter(r => r.date.toISOString().split("T")[0] === d)
                .reduce((s, r) => s + r.bags, 0),
        }));

        // Gas balance by digester (all time)
        const allDistributions = await prisma.gasDistribution.findMany({
            select: { digesterId: true, volume: true },
        });
        const allMeterReadings = await prisma.flowMeterReading.findMany({
            orderBy: [{ digesterId: "asc" }, { date: "asc" }],
            select: { digesterId: true, reading: true },
        });
        const allCompost = await prisma.compostLog.findMany({
            select: { digesterId: true, bags: true },
        });

        const digesters = await prisma.digester.findMany({
            select: { id: true },
        });

        const metersByDig: Record<string, number[]> = {};
        for (const r of allMeterReadings) {
            if (!metersByDig[r.digesterId]) metersByDig[r.digesterId] = [];
            metersByDig[r.digesterId].push(r.reading);
        }

        const gasBalance = digesters.map(d => {
            const readings = metersByDig[d.id] ?? [];
            const produced = readings.length >= 2 ? +(readings[readings.length - 1] - readings[0]).toFixed(1) : 0;
            const distributed = +allDistributions
                .filter(r => r.digesterId === d.id)
                .reduce((s, r) => s + r.volume, 0)
                .toFixed(1);
            return { id: d.id, produced, distributed };
        });

        const compostByDigester = digesters.map(d => ({
            id: d.id,
            bags: allCompost.filter(r => r.digesterId === d.id).reduce((s, r) => s + r.bags, 0),
        }));

        return {
            gasTrend,
            fsTrend,
            feedstockByType,
            compostTrend,
            gasBalance,
            compostByDigester,
        };
    },

    getTableData: async (module: string, from?: string, to?: string) => {
        const where: Record<string, unknown> = {};
        if (from || to) {
            where.date = {};
            if (from) (where.date as Record<string, unknown>).gte = new Date(`${from}T00:00:00.000Z`);
            if (to) (where.date as Record<string, unknown>).lte = new Date(`${to}T23:59:59.999Z`);
        }

        if (module === "feedstock") {
            return prisma.feedstockLog.findMany({
                where,
                orderBy: { date: "desc" },
                include: {
                    digester: { select: { location: true } },
                },
            }).then(rows => rows.map(r => ({
                id: r.id,
                date: r.date.toISOString().split("T")[0],
                digesterId: r.digesterId,
                location: r.digester.location,
                operatorId: r.operatorId,
                type: r.type,
                weight: r.weight,
                waterLitres: r.waterLitres,
                photoUrl: r.photoUrl,
                notes: r.notes,
            })));
        }

        if (module === "meter") {
            return prisma.flowMeterReading.findMany({
                where,
                orderBy: { date: "desc" },
                include: {
                    digester: { select: { location: true } },
                },
            }).then(rows => rows.map(r => ({
                id: r.id,
                date: r.date.toISOString().split("T")[0],
                digesterId: r.digesterId,
                location: r.digester.location,
                operatorId: r.operatorId,
                reading: r.reading,
                photoUrl: r.photoUrl,
                notes: r.notes,
            })));
        }

        if (module === "distribution") {
            return prisma.gasDistribution.findMany({
                where,
                orderBy: { date: "desc" },
                include: {
                    digester: { select: { location: true } },
                    household: { select: { headName: true, phone: true, members: true } },
                },
            }).then(rows => rows.map(r => ({
                id: r.id,
                date: r.date.toISOString().split("T")[0],
                digesterId: r.digesterId,
                location: r.digester.location,
                operatorId: r.operatorId,
                householdId: r.householdId,
                householdHead: r.household.headName,
                volume: r.volume,
            })));
        }

        if (module === "compost") {
            return prisma.compostLog.findMany({
                where,
                orderBy: { date: "desc" },
                include: {
                    digester: { select: { location: true } },
                },
            }).then(rows => rows.map(r => ({
                id: r.id,
                date: r.date.toISOString().split("T")[0],
                digesterId: r.digesterId,
                location: r.digester.location,
                operatorId: r.operatorId,
                bags: r.bags,
                photoUrl: r.photoUrl,
                notes: r.notes,
            })));
        }

        return [];
    },
};
