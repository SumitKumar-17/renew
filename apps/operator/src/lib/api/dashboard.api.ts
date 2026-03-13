import { apiClient } from "./client";
import { db } from "../offline/db";
import { getDigesterId } from "./session";

export interface DashboardSummary {
    digester: { id: string; location: string; status: string };
    householdCount: number;
    gasBalance: {
        totalProduced: number;
        totalDistributed: number;
        surplus: number;
        isDeficit: boolean;
    };
    lastMeterReading: { reading: number; date: string } | null;
    totalFeedstockKg: number;
    todayStatus: {
        feedstockLogged: boolean;
        meterLogged: boolean;
        isComplete: boolean;
    };
    recentActivity: Array<{
        type: "feedstock" | "meter" | "distribution" | "compost";
        date: string;
        summary: string;
        synced: boolean;
        id: string;
    }>;
    streak: number;
}

export const dashboardApi = {

    getSummary: async () => {
        const digesterId = getDigesterId();

        try {
            const res = await apiClient.get("/dashboard");

            localStorage.setItem(
                `dashboard_${digesterId}`,
                JSON.stringify({
                    data: res.data.data,
                    cachedAt: new Date().toISOString(),
                })
            );

            return res.data.data;

        } catch {
            // Offline — build from IndexedDB
            const todayStr = new Date().toISOString().split("T")[0];

            const [
                feedstockLogs,
                meterReadings,
                distributions,
                compostLogs,
                householdCount,
                allMeter,
                allDist,
                allFeedstock,
            ] = await Promise.all([
                db.feedstock.where("digesterId").equals(digesterId)
                    .reverse().sortBy("date").then(r => r.slice(0, 3)),
                db.meter.where("digesterId").equals(digesterId)
                    .reverse().sortBy("date").then(r => r.slice(0, 3)),
                db.distribution.where("digesterId").equals(digesterId)
                    .reverse().sortBy("date").then(r => r.slice(0, 3)),
                db.compost.where("digesterId").equals(digesterId)
                    .reverse().sortBy("date").then(r => r.slice(0, 3)),
                db.households.where("digesterId").equals(digesterId).count(),
                db.meter.where("digesterId").equals(digesterId).sortBy("date"),
                db.distribution.where("digesterId").equals(digesterId).toArray(),
                db.feedstock.where("digesterId").equals(digesterId).toArray(),
            ]);

            const totalProduced = allMeter.length >= 2
                ? +(allMeter[allMeter.length - 1].reading - allMeter[0].reading).toFixed(2)
                : 0;

            const totalDistributed = +allDist
                .reduce((s, r) => s + r.volume, 0).toFixed(2);

            const totalFeedstockKg = allFeedstock
                .reduce((s, r) => s + r.weight, 0);

            const lastMeter = allMeter[allMeter.length - 1];

            const recentActivity = [
                ...feedstockLogs.map(r => ({
                    type: "feedstock" as const,
                    date: r.date,
                    summary: `${r.type} · ${r.weight} kg`,
                    synced: r.synced,
                    id: r.id,
                })),
                ...meterReadings.map(r => ({
                    type: "meter" as const,
                    date: r.date,
                    summary: `Meter: ${r.reading} m³`,
                    synced: r.synced,
                    id: r.id,
                })),
                ...distributions.map(r => ({
                    type: "distribution" as const,
                    date: r.date,
                    summary: `${r.householdName} · ${r.volume} m³`,
                    synced: r.synced,
                    id: r.id,
                })),
                ...compostLogs.map(r => ({
                    type: "compost" as const,
                    date: r.date,
                    summary: `${r.bags} bags`,
                    synced: r.synced,
                    id: r.id,
                })),
            ]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5);

            return {
                digester: {
                    id: digesterId,
                    location: "—",
                    status: "active",
                },
                householdCount,
                gasBalance: {
                    totalProduced,
                    totalDistributed,
                    surplus: +(totalProduced - totalDistributed).toFixed(2),
                    isDeficit: totalProduced - totalDistributed < 0,
                },
                lastMeterReading: lastMeter
                    ? { reading: lastMeter.reading, date: lastMeter.date }
                    : null,
                totalFeedstockKg,
                todayStatus: {
                    feedstockLogged: allFeedstock.some(r => r.date === todayStr),
                    meterLogged: allMeter.some(r => r.date === todayStr),
                    isComplete:
                        allFeedstock.some(r => r.date === todayStr) &&
                        allMeter.some(r => r.date === todayStr),
                },
                recentActivity,
                streak: 0,
            };
        }
    },

};