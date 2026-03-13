import { apiClient } from "./client";
import { enqueue } from "../offline/queue";
import { db } from "../offline/db";
import { v4 as uuid } from "uuid";
import { getDigesterId } from "./session";

export const householdApi = {

    submit: async (
        formData: {
            headName: string;
            phone: string;
            address?: string;
            members: number;
            fuelReplaced: string[];
        },
        isOnline: boolean
    ) => {
        const digesterId = getDigesterId();
        const localId = uuid();

        if (isOnline) {
            const res = await apiClient.post("/households", formData);
            const record = res.data.data;

            await db.households.put({
                id: record.id,
                digesterId,
                headName: record.headName,
                phone: record.phone,
                address: record.address,
                members: record.members,
                fuelReplaced: record.fuelReplaced,
                joinedAt: record.joinedAt,
            });

            return { ...record, synced: true };

        } else {
            await enqueue("household", formData);

            await db.households.put({
                id: localId,
                digesterId,
                headName: formData.headName,
                phone: formData.phone,
                address: formData.address,
                members: formData.members,
                fuelReplaced: formData.fuelReplaced,
                joinedAt: new Date().toISOString(),
            });

            return { id: localId, ...formData, synced: false };
        }
    },

    getAll: async () => {
        const digesterId = getDigesterId();

        try {
            const res = await apiClient.get("/households");
            const records = res.data.data;

            await db.households.bulkPut(
                records.map((r: any) => ({
                    id: r.id,
                    digesterId,
                    headName: r.headName,
                    phone: r.phone,
                    address: r.address,
                    members: r.members,
                    fuelReplaced: r.fuelReplaced,
                    joinedAt: r.joinedAt,
                }))
            );

            return records;

        } catch {
            return db.households
                .where("digesterId")
                .equals(digesterId)
                .toArray();
        }
    },

};