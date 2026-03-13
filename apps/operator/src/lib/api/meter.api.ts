import { apiClient } from "./client";
import { enqueue } from "../offline/queue";
import { db } from "../offline/db";
import { v4 as uuid } from "uuid";
import { getDigesterId } from "./session";

export const meterApi = {

    submit: async (
        formData: {
            date: string;
            reading: number;
            notes?: string;
        },
        photo: File,
        isOnline: boolean
    ) => {
        const digesterId = getDigesterId();
        const localId = uuid();

        if (isOnline) {
            const fd = new FormData();
            fd.append("photo", photo);
            fd.append("date", formData.date);
            fd.append("reading", formData.reading.toString());
            if (formData.notes) fd.append("notes", formData.notes);

            const res = await apiClient.post("/meter", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const record = res.data.data;

            await db.meter.add({
                id: record.id,
                localId,
                date: formData.date,
                reading: formData.reading,
                dailyProduction: record.dailyProduction,
                notes: formData.notes,
                photoUrl: record.photoUrl,
                synced: true,
                digesterId,
                createdAt: new Date().toISOString(),
            });

            return { ...record, synced: true, localId };

        } else {
            await enqueue("meter", formData, {
                blob: photo,
                name: photo.name,
                mime: photo.type,
            });

            await db.meter.add({
                id: localId,
                localId,
                date: formData.date,
                reading: formData.reading,
                dailyProduction: undefined,
                notes: formData.notes,
                photoUrl: undefined,
                synced: false,
                digesterId,
                createdAt: new Date().toISOString(),
            });

            return { id: localId, ...formData, synced: false, localId };
        }
    },

    getAll: async (from?: string, to?: string) => {
        const digesterId = getDigesterId();

        try {
            const params = new URLSearchParams();
            if (from) params.append("from", from);
            if (to) params.append("to", to);

            const res = await apiClient.get(`/meter?${params}`);
            const records = res.data.data;

            await db.meter.where("synced").equals(1).delete();
            await db.meter.bulkPut(
                records.map((r: any) => ({
                    ...r,
                    date: r.date.split("T")[0],
                    synced: true,
                    localId: undefined,
                    digesterId,
                    createdAt: r.createdAt,
                }))
            );

            return records.map((r: any) => ({ ...r, synced: true }));

        } catch {
            const records = await db.meter
                .where("digesterId")
                .equals(digesterId)
                .reverse()
                .sortBy("date");

            return records.filter(r => {
                if (from && r.date < from) return false;
                if (to && r.date > to) return false;
                return true;
            });
        }
    },

    getLastReading: async () => {
        const digesterId = getDigesterId();

        try {
            const res = await apiClient.get("/meter/last");
            return res.data.data;
        } catch {
            const records = await db.meter
                .where("digesterId")
                .equals(digesterId)
                .reverse()
                .sortBy("date");

            return records[0] ?? null;
        }
    },

};