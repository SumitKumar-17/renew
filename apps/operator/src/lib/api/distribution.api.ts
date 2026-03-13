import { apiClient } from "./client";
import { enqueue } from "../offline/queue";
import { db } from "../offline/db";
import { v4 as uuid } from "uuid";
import { getDigesterId } from "./session";

export const distributionApi = {

    submit: async (
        formData: {
            date: string;
            items: { householdId: string; volume: number }[];
        },
        isOnline: boolean,
        householdMap: Map<string, string>
    ) => {
        const digesterId = getDigesterId();
        const localId = uuid();

        if (isOnline) {
            const res = await apiClient.post("/distribution", formData);
            const result = res.data.data;

            await db.distribution.bulkAdd(
                result.records.map((r: any) => ({
                    id: r.id,
                    localId: uuid(),
                    date: formData.date,
                    householdId: r.householdId,
                    householdName: r.household.headName,
                    volume: r.volume,
                    synced: true,
                    digesterId,
                    createdAt: new Date().toISOString(),
                }))
            );

            return { ...result, synced: true };

        } else {
            await enqueue("distribution", formData);

            await db.distribution.bulkAdd(
                formData.items.map(item => ({
                    id: uuid(),
                    localId,
                    date: formData.date,
                    householdId: item.householdId,
                    householdName: householdMap.get(item.householdId) ?? "Unknown",
                    volume: item.volume,
                    synced: false,
                    digesterId,
                    createdAt: new Date().toISOString(),
                }))
            );

            return {
                records: formData.items,
                summary: {
                    householdsServed: formData.items.length,
                    totalDistributed: formData.items.reduce((s, i) => s + i.volume, 0),
                },
                synced: false,
            };
        }
    },

    getAll: async (from?: string, to?: string) => {
        const digesterId = getDigesterId();

        try {
            const params = new URLSearchParams();
            if (from) params.append("from", from);
            if (to) params.append("to", to);

            const res = await apiClient.get(`/distribution?${params}`);
            const records = res.data.data;

            await db.distribution.where("synced").equals(1).delete();
            await db.distribution.bulkPut(
                records.map((r: any) => ({
                    id: r.id,
                    localId: undefined,
                    date: r.date.split("T")[0],
                    householdId: r.householdId,
                    householdName: r.household.headName,
                    volume: r.volume,
                    synced: true,
                    digesterId,
                    createdAt: r.createdAt,
                }))
            );

            return records.map((r: any) => ({ ...r, synced: true }));

        } catch {
            const records = await db.distribution
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

    getBalance: async () => {
        const digesterId = getDigesterId();

        try {
            const res = await apiClient.get("/distribution/balance");
            return res.data.data;
        } catch {
            const meterRecords = await db.meter
                .where("digesterId")
                .equals(digesterId)
                .sortBy("date");

            const totalProduced = meterRecords.length >= 2
                ? +(
                    meterRecords[meterRecords.length - 1].reading -
                    meterRecords[0].reading
                ).toFixed(2)
                : 0;

            const distRecords = await db.distribution
                .where("digesterId")
                .equals(digesterId)
                .toArray();

            const totalDistributed = +distRecords
                .reduce((s, r) => s + r.volume, 0)
                .toFixed(2);

            const surplus = +(totalProduced - totalDistributed).toFixed(2);

            return {
                totalProduced,
                totalDistributed,
                surplus,
                isDeficit: surplus < 0,
            };
        }
    },

};