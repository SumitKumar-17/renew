import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { uploadToS3 } from "../../utils/uploadToS3";
import { CreateMeterReadingDto } from "@renew-hope/shared";

export const meterService = {

    // Submit new meter reading
    create: async (
        dto: CreateMeterReadingDto,
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

        // 2. Get last reading for this digester
        const lastReading = await prisma.flowMeterReading.findFirst({
            where: { digesterId },
            orderBy: { date: "desc" },
        });

        // 3. New reading must be greater than last reading
        if (lastReading && dto.reading <= lastReading.reading) {
            throw AppError.badRequest(
                `Reading must be greater than last reading (${lastReading.reading} m³)`
            );
        }

        // 4. Check no reading already exists for this date
        const existingToday = await prisma.flowMeterReading.findFirst({
            where: {
                digesterId,
                date: new Date(dto.date),
            },
        });

        if (existingToday) {
            throw AppError.badRequest(
                "A meter reading for this date already exists"
            );
        }

        // 5. Upload photo to S3
        const { url: photoUrl } = await uploadToS3(
            photo.buffer,
            `meter/${digesterId}`,
            photo.originalname,
            photo.mimetype
        );

        // 6. Create reading
        const reading = await prisma.flowMeterReading.create({
            data: {
                date: new Date(dto.date),
                reading: dto.reading,
                notes: dto.notes,
                photoUrl,
                digesterId,
                operatorId,
            },
        });

        // 7. Derive daily production
        const dailyProduction = lastReading
            ? +(dto.reading - lastReading.reading).toFixed(2)
            : null;

        return {
            ...reading,
            dailyProduction,
            isFirstReading: !lastReading,
        };
    },

    // Get all readings for a digester with derived daily production
    getByDigester: async (
        digesterId: string,
        from?: string,
        to?: string
    ) => {
        const readings = await prisma.flowMeterReading.findMany({
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
            orderBy: { date: "asc" },
        });

        // Derive daily production for each reading
        const withProduction = readings.map((reading, index) => {
            const prev = readings[index - 1];
            const dailyProduction = prev
                ? +(reading.reading - prev.reading).toFixed(2)
                : null;

            return {
                ...reading,
                dailyProduction,
                isFirstReading: index === 0,
            };
        });

        // Return in descending order for display
        return withProduction.reverse();
    },

    // Get last reading for a digester
    getLastReading: async (digesterId: string) => {
        const reading = await prisma.flowMeterReading.findFirst({
            where: { digesterId },
            orderBy: { date: "desc" },
        });

        return reading;
    },

    // Get total gas produced for a digester
    getTotalProduced: async (
        digesterId: string,
        from?: string,
        to?: string
    ) => {
        const readings = await prisma.flowMeterReading.findMany({
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
            orderBy: { date: "asc" },
            select: { reading: true },
        });

        if (readings.length < 2) return 0;

        // Total = last reading - first reading
        const first = readings[0].reading;
        const last = readings[readings.length - 1].reading;

        return +(last - first).toFixed(2);
    },

    // Admin — get all readings across all digesters
    getAll: async (from?: string, to?: string) => {
        const readings = await prisma.flowMeterReading.findMany({
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

        return readings;
    },

};