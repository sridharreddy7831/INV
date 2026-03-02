// ─── Standard API response helpers ───

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export function successResponse<T>(data: T, message?: string, meta?: ApiResponse['meta']): ApiResponse<T> {
    return { success: true, data, message, meta };
}

export function errorResponse(error: string, message?: string): ApiResponse {
    return { success: false, error, message };
}

export function paginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
): ApiResponse<T[]> {
    return {
        success: true,
        data,
        message,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
