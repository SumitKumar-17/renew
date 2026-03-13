import { prisma } from "../../config/database";
import { uploadToS3 } from "../../utils/uploadToS3";
import { logger } from "../../config/logger";

export type SyncActionType =
    | "feedstock"
    | "meter"
    | "distribution"
    | "compost"
    | "household";

export interface SyncItem {
    localId: string;        // UUID generated on client
    action: SyncActionType;
    payload: Record<string, any>;
    timestamp: string;        // ISO string — when it was created offline
}

export interface SyncResult {
    localId: string;
    success: boolean;
    serverId?: string;
    error?: string;
}

export const syncService = {

    processBatch: async (
        items: SyncItem[],
        digesterId: string,
        operatorId: string,
        photos: Express.Multer.File[]
    ): Promise<SyncResult[]> => {
        const results: SyncResult[] = [];

        // Build photo map by localId
        const photoMap = new Map<string, Express.Multer.File>();
        photos.forEach(p => {
            // fieldname is "photo_<localId>"
            const localId = p.fieldname.replace("photo_", "");
            photoMap.set(localId, p);
        });

        // Process each item sequentially
        // Sequential not parallel — order matters
        // (meter readings must be in date order)
        for (const item of items) {
            try {
                const serverId = await syncService.processItem(
                    item,
                    digesterId,
                    operatorId,
                    photoMap.get(item.localId)
                );

                results.push({
                    localId: item.localId,
                    success: true,
                    serverId,
                });

            } catch (err: any) {
                logger.error(`Sync failed for item ${item.localId}:`, err.message);
                results.push({
                    localId: item.localId,
                    success: false,
                    error: err.message,
                });
            }
        }

        return results;
    },

    processItem: async (
        item: SyncItem,
        digesterId: string,
        operatorId: string,
        photo?: Express.Multer.File
    ): Promise<string> => {
        switch (item.action) {

            case "feedstock": {
                if (!photo) throw new Error("Photo required for feedstock");

                // Check duplicate — same digester + date + type
                const existing = await prisma.feedstockLog.findFirst({
                    where: {
                        digesterId,
                        date: new Date(item.payload.date),
                        type: item.payload.type,
                    },
                });

                if (existing) return existing.id; // Already synced — return existing ID

                const { url: photoUrl } = await uploadToS3(
                    photo.buffer,
                    `feedstock/${digesterId}`,
                    photo.originalname,
                    photo.mimetype
                );

                const log = await prisma.feedstockLog.create({
                    data: {
                        date: new Date(item.payload.date),
                        weight: parseFloat(item.payload.weight),
                        waterLitres: parseFloat(item.payload.waterLitres) || 0,
                        type: item.payload.type,
                        notes: item.payload.notes || null,
                        photoUrl,
                        digesterId,
                        operatorId,
                    },
                });

                return log.id;
            }

            case "meter": {
                if (!photo) throw new Error("Photo required for meter reading");

                // Check duplicate — same digester + date
                const existing = await prisma.flowMeterReading.findFirst({
                    where: {
                        digesterId,
                        date: new Date(item.payload.date),
                    },
                });

                if (existing) return existing.id;

                // Validate reading is greater than last
                const lastReading = await prisma.flowMeterReading.findFirst({
                    where: { digesterId },
                    orderBy: { date: "desc" },
                });

                const newReading = parseFloat(item.payload.reading);

                if (lastReading && newReading <= lastReading.reading) {
                    throw new Error(
                        `Reading ${newReading} must be greater than last reading ${lastReading.reading}`
                    );
                }

                const { url: photoUrl } = await uploadToS3(
                    photo.buffer,
                    `meter/${digesterId}`,
                    photo.originalname,
                    photo.mimetype
                );

                const reading = await prisma.flowMeterReading.create({
                    data: {
                        date: new Date(item.payload.date),
                        reading: newReading,
                        notes: item.payload.notes || null,
                        photoUrl,
                        digesterId,
                        operatorId,
                    },
                });

                return reading.id;
            }

            case "distribution": {
                // Check duplicate — same digester + date + household
                const items = item.payload.items as Array<{
                    householdId: string;
                    volume: number;
                }>;

                const results = [];

                for (const distItem of items) {
                    const existing = await prisma.gasDistribution.findFirst({
                        where: {
                            digesterId,
                            householdId: distItem.householdId,
                            date: new Date(item.payload.date),
                        },
                    });

                    if (existing) {
                        results.push(existing.id);
                        continue;
                    }

                    // Verify household belongs to digester
                    const household = await prisma.household.findFirst({
                        where: {
                            id: distItem.householdId,
                            digesterId,
                        },
                    });

                    if (!household) {
                        throw new Error(
                            `Household ${distItem.householdId} does not belong to your digester`
                        );
                    }

                    const record = await prisma.gasDistribution.create({
                        data: {
                            date: new Date(item.payload.date),
                            volume: distItem.volume,
                            digesterId,
                            operatorId,
                            householdId: distItem.householdId,
                        },
                    });

                    results.push(record.id);
                }

                return results.join(",");
            }

            case "compost": {
                if (!photo) throw new Error("Photo required for compost log");

                // Check duplicate — same digester + date
                const existing = await prisma.compostLog.findFirst({
                    where: {
                        digesterId,
                        date: new Date(item.payload.date),
                    },
                });

                if (existing) return existing.id;

                const { url: photoUrl } = await uploadToS3(
                    photo.buffer,
                    `compost/${digesterId}`,
                    photo.originalname,
                    photo.mimetype
                );

                const log = await prisma.compostLog.create({
                    data: {
                        date: new Date(item.payload.date),
                        bags: parseInt(item.payload.bags),
                        notes: item.payload.notes || null,
                        photoUrl,
                        digesterId,
                        operatorId,
                    },
                });

                return log.id;
            }

            case "household": {
                // Check duplicate — same digester + phone
                const existing = await prisma.household.findFirst({
                    where: {
                        digesterId,
                        phone: item.payload.phone,
                    },
                });

                if (existing) return existing.id;

                const household = await prisma.household.create({
                    data: {
                        headName: item.payload.headName,
                        phone: item.payload.phone,
                        address: item.payload.address || null,
                        members: parseInt(item.payload.members),
                        fuelReplaced: item.payload.fuelReplaced,
                        digesterId,
                    },
                });

                return household.id;
            }

            default:
                throw new Error(`Unknown action type: ${item.action}`);
        }
    },

};