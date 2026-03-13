import { v4 as uuid } from "uuid";
import { db, QueuedItem } from "./db";

export const enqueue = async (
    action: QueuedItem["action"],
    payload: Record<string, any>,
    photo?: { blob: Blob; name: string; mime: string }
): Promise<string> => {
    const localId = uuid();

    await db.queue.add({
        localId,
        action,
        payload,
        photoBlob: photo?.blob,
        photoName: photo?.name,
        photoMime: photo?.mime,
        createdAt: Date.now(),
        retries: 0,
    });

    return localId;
};

export const getQueue = async (): Promise<QueuedItem[]> => {
    return db.queue.orderBy("createdAt").toArray();
};

export const removeFromQueue = async (localId: string): Promise<void> => {
    await db.queue.where("localId").equals(localId).delete();
};

export const incrementRetry = async (
    localId: string,
    error: string
): Promise<void> => {
    await db.queue
        .where("localId")
        .equals(localId)
        .modify(item => {
            item.retries++;
            item.error = error;
        });
};

export const clearQueue = async (): Promise<void> => {
    await db.queue.clear();
};

export const getQueueCount = async (): Promise<number> => {
    return db.queue.count();
};