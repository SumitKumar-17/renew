import Dexie, { Table } from "dexie";

// Every item that goes into the offline queue
export interface QueuedItem {
    id?: number;          // auto-increment primary key
    localId: string;          // UUID — links to photo, tracks result
    action: "feedstock" | "meter" | "distribution" | "compost" | "household";
    payload: Record<string, any>;
    photoBlob?: Blob;            // stored as binary
    photoName?: string;
    photoMime?: string;
    createdAt: number;          // timestamp ms
    retries: number;          // how many times sync was attempted
    error?: string;          // last error message if any
}

// Cached server data for offline reads
export interface CachedHousehold {
    id: string;
    digesterId: string;
    headName: string;
    phone: string;
    address?: string;
    members: number;
    fuelReplaced: string[];
    joinedAt: string;
}

export interface CachedFeedstockLog {
    id: string;
    localId?: string;          // set if created offline
    date: string;
    weight: number;
    waterLitres: number;
    type: string;
    notes?: string;
    photoUrl?: string;          // null if offline — photo in IndexedDB
    synced: boolean;
    digesterId: string;
    createdAt: string;
}

export interface CachedMeterReading {
    id: string;
    localId?: string;
    date: string;
    reading: number;
    dailyProduction?: number;
    notes?: string;
    photoUrl?: string;
    synced: boolean;
    digesterId: string;
    createdAt: string;
}

export interface CachedDistribution {
    id: string;
    localId?: string;
    date: string;
    householdId: string;
    householdName: string;
    volume: number;
    synced: boolean;
    digesterId: string;
    createdAt: string;
}

export interface CachedCompostLog {
    id: string;
    localId?: string;
    date: string;
    bags: number;
    notes?: string;
    photoUrl?: string;
    synced: boolean;
    digesterId: string;
    createdAt: string;
}

class RenewHopeDB extends Dexie {
    // Offline queue
    queue!: Table<QueuedItem>;

    // Cached data for offline reads
    households!: Table<CachedHousehold>;
    feedstock!: Table<CachedFeedstockLog>;
    meter!: Table<CachedMeterReading>;
    distribution!: Table<CachedDistribution>;
    compost!: Table<CachedCompostLog>;

    constructor() {
        super("RenewHopeDB");

        this.version(1).stores({
            queue: "++id, localId, action, createdAt",
            households: "id, digesterId",
            feedstock: "id, localId, digesterId, date, synced",
            meter: "id, localId, digesterId, date, synced",
            distribution: "id, localId, digesterId, date, synced",
            compost: "id, localId, digesterId, date, synced",
        });
    }
}

export const db = new RenewHopeDB();