import { Request } from 'express';

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
    orderBy: Record<string, 'asc' | 'desc'>;
}

export function parsePagination(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    return { page, limit, skip, orderBy: { [sortBy]: sortOrder } };
}

export function parseFilters(req: Request, allowedFields: string[]): Record<string, any> {
    const where: Record<string, any> = {};

    for (const field of allowedFields) {
        const value = req.query[field];
        if (value !== undefined && value !== '') {
            where[field] = value;
        }
    }

    // Search support
    const search = req.query.search as string;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
        ];
    }

    // Soft-delete: exclude deleted by default
    if (!req.query.includeDeleted) {
        where.deletedAt = null;
    }

    return where;
}
