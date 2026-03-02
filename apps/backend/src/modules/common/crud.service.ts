import prisma from '../../database/prisma';
import { NotFoundError } from '../../utils/errors';
import { PaginationParams } from '../../utils/query';

/**
 * Generic CRUD service factory.
 * Eliminates repetition for Products, Customers, Vendors, etc.
 */
export function createCrudService<T>(modelName: string) {
    const model = (prisma as any)[modelName];

    if (!model) {
        throw new Error(`Prisma model "${modelName}" does not exist`);
    }

    return {
        async findAll(
            where: Record<string, any> = {},
            pagination?: PaginationParams,
            include?: Record<string, any>
        ): Promise<{ data: T[]; total: number }> {
            const [data, total] = await Promise.all([
                model.findMany({
                    where,
                    ...(pagination && {
                        skip: pagination.skip,
                        take: pagination.limit,
                        orderBy: pagination.orderBy,
                    }),
                    ...(include && { include }),
                }),
                model.count({ where }),
            ]);
            return { data, total };
        },

        async findById(id: string, include?: Record<string, any>): Promise<T> {
            const record = await model.findUnique({
                where: { id },
                ...(include && { include }),
            });
            if (!record) throw new NotFoundError(modelName);
            return record;
        },

        async create(data: any, include?: Record<string, any>): Promise<T> {
            return model.create({
                data,
                ...(include && { include }),
            });
        },

        async update(id: string, data: any, include?: Record<string, any>): Promise<T> {
            await this.findById(id); // Ensure exists
            return model.update({
                where: { id },
                data,
                ...(include && { include }),
            });
        },

        async delete(id: string): Promise<T> {
            await this.findById(id);
            return model.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
        },

        async hardDelete(id: string): Promise<T> {
            await this.findById(id);
            return model.delete({ where: { id } });
        },

        async seed(items: any[]): Promise<{ created: number; skipped: number }> {
            let created = 0;
            let skipped = 0;

            for (const item of items) {
                try {
                    const { id, ...rest } = item;
                    await model.upsert({
                        where: { id: id || `seed_${Date.now()}_${Math.random()}` },
                        update: {},
                        create: { id, ...rest },
                    });
                    created++;
                } catch {
                    skipped++;
                }
            }

            return { created, skipped };
        },
    };
}
