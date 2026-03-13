import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { CreateDistributionDto } from "@renew-hope/shared";
import { meterService } from "../meter/meter.service";

export const distributionService = {

    // Submit gas distribution for multiple households
    create: async (
        dto: CreateDistributionDto,
        digesterId: string,
        operatorId: string
    ) => {
        // 1. Verify digester exists and is active
        const digester = await prisma.digester.findUnique({
            where: { id: digesterId },
        });

        if (!digester) {
            throw AppError.notFound("Digester not found");
        }

        if (digester.status !== "active") {
            throw AppError.badRequest("Digester is not active");
        }

        // 2. Fetch all households for this digester from DB
        //    Never trust household names from client
        const digesterHouseholds = await prisma.household.findMany({
            where: { digesterId },
        });

        const householdMap = new Map(
            digesterHouseholds.map(hh => [hh.id, hh])
        );

        // 3. Verify every householdId in request belongs to this digester
        for (const item of dto.items) {
            if (!householdMap.has(item.householdId)) {
                throw AppError.badRequest(
                    `Household ${item.householdId} does not belong to your digester`
                );
            }
        }

        // 4. Calculate total volume being distributed now
        const totalNewDistribution = dto.items.reduce(
            (sum, item) => sum + item.volume,
            0
        );

        // 5. Get total gas produced so far
        const totalProduced = await meterService.getTotalProduced(digesterId);

        // 6. Get total already distributed
        const existingDistribution = await prisma.gasDistribution.aggregate({
            where: { digesterId },
            _sum: { volume: true },
        });

        const totalAlreadyDistributed =
            existingDistribution._sum.volume ?? 0;

        // 7. Check surplus
        const surplus =
            totalProduced - totalAlreadyDistributed - totalNewDistribution;

        if (surplus < 0) {
            throw AppError.badRequest(
                `Insufficient gas. ` +
                `Produced: ${totalProduced} m³, ` +
                `Already distributed: ${totalAlreadyDistributed} m³, ` +
                `Requested: ${totalNewDistribution} m³. ` +
                `Surplus available: ${(totalProduced - totalAlreadyDistributed).toFixed(2)} m³`
            );
        }

        // 8. Create all distribution records in a transaction
        //    Either all save or none save
        const records = await prisma.$transaction(
            dto.items.map(item => {
                const household = householdMap.get(item.householdId)!;
                return prisma.gasDistribution.create({
                    data: {
                        date: new Date(dto.date),
                        volume: item.volume,
                        digesterId,
                        operatorId,
                        householdId: item.householdId,
                    },
                    include: {
                        household: {
                            select: {
                                headName: true,
                                phone: true,
                            },
                        },
                    },
                });
            })
        );

        return {
            records,
            summary: {
                date: dto.date,
                householdsServed: records.length,
                totalDistributed: totalNewDistribution,
                remainingSurplus: +surplus.toFixed(2),
            },
        };
    },

    // Get distribution records for a digester
    getByDigester: async (
        digesterId: string,
        from?: string,
        to?: string
    ) => {
        const records = await prisma.gasDistribution.findMany({
            where: {
                digesterId,
                ...(from || to
                    ? {
                        date: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {}),
                        },
                    }
                    : {}),
            },
            orderBy: { date: "desc" },
            include: {
                household: {
                    select: {
                        headName: true,
                        phone: true,
                        members: true,
                    },
                },
            },
        });

        return records;
    },

    // Get gas balance for a digester
    getBalance: async (digesterId: string) => {
        // Total produced
        const totalProduced = await meterService.getTotalProduced(digesterId);

        // Total distributed
        const distributed = await prisma.gasDistribution.aggregate({
            where: { digesterId },
            _sum: { volume: true },
        });

        const totalDistributed = distributed._sum.volume ?? 0;
        const surplus = +(totalProduced - totalDistributed).toFixed(2);

        return {
            totalProduced: +totalProduced.toFixed(2),
            totalDistributed: +totalDistributed.toFixed(2),
            surplus,
            isDeficit: surplus < 0,
        };
    },

    // Admin — get all distribution records
    getAll: async (from?: string, to?: string) => {
        const records = await prisma.gasDistribution.findMany({
            where: {
                ...(from || to
                    ? {
                        date: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {}),
                        },
                    }
                    : {}),
            },
            orderBy: { date: "desc" },
            include: {
                household: {
                    select: {
                        headName: true,
                        phone: true,
                        members: true,
                    },
                },
                digester: {
                    select: {
                        id: true,
                        location: true,
                    },
                },
            },
        });

        return records;
    },

};