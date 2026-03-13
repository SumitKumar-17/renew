export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}

export interface DashboardSummary {
    totalProduced: number;
    totalDistributed: number;
    surplus: number;
    lastMeterReading: number | null;
    lastReadingDate: string | null;
    householdCount: number;
}