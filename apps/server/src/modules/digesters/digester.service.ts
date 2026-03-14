import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/hash";

export const digesterService = {

    getAll: async () => {
        const digesters = await prisma.digester.findMany({
            orderBy: { createdAt: "asc" },
            include: {
                user: {
                    select: { id: true, name: true, phone: true, status: true },
                },
                _count: {
                    select: { households: true },
                },
            },
        });

        return digesters.map(d => ({
            id: d.id,
            location: d.location,
            installedDate: d.installedDate.toISOString().split("T")[0],
            status: d.status,
            createdAt: d.createdAt.toISOString(),
            operator: d.user
                ? {
                    id: d.user.id,
                    name: d.user.name,
                    phone: d.user.phone,
                    status: d.user.status,
                }
                : null,
            householdCount: d._count.households,
        }));
    },

    getById: async (id: string) => {
        const d = await prisma.digester.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, phone: true, status: true },
                },
                households: {
                    orderBy: { joinedAt: "asc" },
                    select: {
                        id: true,
                        headName: true,
                        phone: true,
                        address: true,
                        members: true,
                        fuelReplaced: true,
                        joinedAt: true,
                    },
                },
            },
        });

        if (!d) throw AppError.notFound("Digester not found");

        // Aggregates
        const [feedstockAgg, meterReadings, distributionAgg, compostAgg] =
            await Promise.all([
                prisma.feedstockLog.aggregate({
                    where: { digesterId: id },
                    _sum: { weight: true },
                    _count: true,
                }),
                prisma.flowMeterReading.findMany({
                    where: { digesterId: id },
                    orderBy: { date: "asc" },
                    select: { date: true, reading: true },
                }),
                prisma.gasDistribution.aggregate({
                    where: { digesterId: id },
                    _sum: { volume: true },
                    _count: true,
                }),
                prisma.compostLog.aggregate({
                    where: { digesterId: id },
                    _sum: { bags: true },
                    _count: true,
                }),
            ]);

        // Derive total gas produced from first→last meter delta
        const totalProduced =
            meterReadings.length >= 2
                ? +(
                    meterReadings[meterReadings.length - 1].reading -
                    meterReadings[0].reading
                ).toFixed(2)
                : 0;

        return {
            id: d.id,
            location: d.location,
            installedDate: d.installedDate.toISOString().split("T")[0],
            status: d.status,
            createdAt: d.createdAt.toISOString(),
            operator: d.user ?? null,
            households: d.households.map(hh => ({
                ...hh,
                joinedAt: hh.joinedAt.toISOString().split("T")[0],
            })),
            stats: {
                totalFeedstockKg: +(feedstockAgg._sum.weight ?? 0).toFixed(1),
                feedstockEntries: feedstockAgg._count,
                totalGasProduced: totalProduced,
                totalDistributed: +(distributionAgg._sum.volume ?? 0).toFixed(2),
                distributionRecords: distributionAgg._count,
                totalCompostBags: compostAgg._sum.bags ?? 0,
                compostEntries: compostAgg._count,
            },
        };
    },

    create: async (data: { id: string; location: string; installedDate: string }) => {
        const existing = await prisma.digester.findUnique({
            where: { id: data.id },
        });
        if (existing) throw AppError.badRequest("Digester ID already exists");

        return prisma.digester.create({
            data: {
                id: data.id.toUpperCase(),
                location: data.location,
                installedDate: new Date(data.installedDate),
                status: "active",
            },
        });
    },

    updateStatus: async (id: string, status: string) => {
        const d = await prisma.digester.findUnique({ where: { id } });
        if (!d) throw AppError.notFound("Digester not found");

        return prisma.digester.update({
            where: { id },
            data: { status },
        });
    },
};
