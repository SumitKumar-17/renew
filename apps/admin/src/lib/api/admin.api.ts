import { apiClient } from "./client";

// ── AUTH ──────────────────────────────────────────────────────────────────

export const authApi = {
    login: async (id: string, password: string) => {
        const res = await apiClient.post("/auth/login", { id, password });
        return res.data.data as {
            accessToken: string;
            refreshToken: string;
            user: { id: string; name: string; role: string; status: string };
        };
    },
};

// ── REPORTS ───────────────────────────────────────────────────────────────

export interface OverviewData {
    stats: {
        digesterCount: number;
        operatorCount: number;
        householdCount: number;
        totalGasProduced: number;
        totalFeedstockKg: number;
        totalCompostBags: number;
        totalDistributed: number;
        surplus: number;
        anomalyCount: number;
        unassignedDigesters: number;
    };
    digesters: Array<{
        id: string;
        location: string;
        status: string;
        operatorId: string | null;
        operatorName: string | null;
        householdCount: number;
        gasProduced: number;
    }>;
    fuelDisplacement: Record<string, number>;
}

export interface ChartsData {
    gasTrend: Array<{ date: string; volume: number }>;
    fsTrend: Array<{ date: string; kg: number }>;
    feedstockByType: Array<{ name: string; value: number }>;
    compostTrend: Array<{ date: string; bags: number }>;
    gasBalance: Array<{ id: string; produced: number; distributed: number }>;
    compostByDigester: Array<{ id: string; bags: number }>;
}

export const reportsApi = {
    getOverview: async (): Promise<OverviewData> => {
        const res = await apiClient.get("/reports/overview");
        return res.data.data;
    },
    getCharts: async (): Promise<ChartsData> => {
        const res = await apiClient.get("/reports/charts");
        return res.data.data;
    },
    getTableData: async (module: string, from?: string, to?: string) => {
        const params: Record<string, string> = {};
        if (from) params.from = from;
        if (to) params.to = to;
        const res = await apiClient.get(`/reports/table/${module}`, { params });
        return res.data.data;
    },
};

// ── DIGESTERS ─────────────────────────────────────────────────────────────

export interface Digester {
    id: string;
    location: string;
    installedDate: string;
    status: string;
    createdAt: string;
    operator: { id: string; name: string; phone: string; status: string } | null;
    householdCount: number;
}

export interface DigesterDetail extends Digester {
    households: Array<{
        id: string;
        headName: string;
        phone: string;
        address: string | null;
        members: number;
        fuelReplaced: string[];
        joinedAt: string;
    }>;
    stats: {
        totalFeedstockKg: number;
        feedstockEntries: number;
        totalGasProduced: number;
        totalDistributed: number;
        distributionRecords: number;
        totalCompostBags: number;
        compostEntries: number;
    };
}

export const digestersApi = {
    getAll: async (): Promise<Digester[]> => {
        const res = await apiClient.get("/digesters");
        return res.data.data;
    },
    getById: async (id: string): Promise<DigesterDetail> => {
        const res = await apiClient.get(`/digesters/${id}`);
        return res.data.data;
    },
    create: async (data: { id: string; location: string; installedDate: string }) => {
        const res = await apiClient.post("/digesters", data);
        return res.data.data;
    },
    updateStatus: async (id: string, status: string) => {
        const res = await apiClient.patch(`/digesters/${id}/status`, { status });
        return res.data.data;
    },
};

// ── OPERATORS ─────────────────────────────────────────────────────────────

export interface Operator {
    id: string;
    name: string;
    phone: string;
    status: string;
    digesterId: string | null;
    digesterLocation: string | null;
    createdAt: string;
}

export const operatorsApi = {
    getAll: async (): Promise<Operator[]> => {
        const res = await apiClient.get("/operators");
        return res.data.data;
    },
    create: async (data: {
        name: string;
        phone: string;
        password: string;
        digesterId?: string;
    }) => {
        const res = await apiClient.post("/operators", data);
        return res.data;
    },
    updateStatus: async (id: string, status: string) => {
        const res = await apiClient.patch(`/operators/${id}/status`, { status });
        return res.data.data;
    },
};

// ── HOUSEHOLDS ────────────────────────────────────────────────────────────

export const householdsApi = {
    getAll: async () => {
        const res = await apiClient.get("/households");
        return res.data.data as Array<{
            id: string;
            headName: string;
            phone: string;
            address: string | null;
            members: number;
            fuelReplaced: string[];
            joinedAt: string;
            digesterId: string;
        }>;
    },
    create: async (data: {
        headName: string;
        phone: string;
        address?: string;
        members: number;
        fuelReplaced: string[];
        digesterId: string;
    }) => {
        const res = await apiClient.post("/households", data);
        return res.data.data;
    },
};
