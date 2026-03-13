import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { uploadToS3 } from "../../utils/uploadToS3";
import { CreateCompostDto } from "@renew-hope/shared";

export const compostService = {

    // Create compost log
    create: async (
        dto: CreateCompostDto,
        digesterId: string,
        operatorId: string,
        photo: Express.Multer.File
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

        // 2. Check no compost log already exists for this date
        const existingToday = await prisma.compostLog.findFirst({
            where: {
                digesterId,
                date: new Date(dto.date),
            },
        });

        if (existingToday) {
            throw AppError.badRequest(
                "A compost log for this date already exists"
            );
        }

        // 3. Upload photo to S3
        const { url: photoUrl } = await uploadToS3(
            photo.buffer,
            `compost/${digesterId}`,
            photo.originalname,
            photo.mimetype
        );

        // 4. Create compost log
        const log = await prisma.compostLog.create({
            data: {
                date: new Date(dto.date),
                bags: dto.bags,
                notes: dto.notes,
                photoUrl,
                digesterId,
                operatorId,
            },
        });

        return log;
    },

    // Get compost logs for a digester
    getByDigester: async (
        digesterId: string,
        from?: string,
        to?: string
    ) => {
        const logs = await prisma.compostLog.findMany({
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
        });

        return logs;
    },

    // Get total bags for a digester
    getTotalBags: async (digesterId: string) => {
        const result = await prisma.compostLog.aggregate({
            where: { digesterId },
            _sum: { bags: true },
        });

        return result._sum.bags ?? 0;
    },

    // Admin — get all compost logs across all digesters
    getAll: async (from?: string, to?: string) => {
        const logs = await prisma.compostLog.findMany({
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
                digester: {
                    select: { id: true, location: true },
                },
            },
        });

        return logs;
    },

};