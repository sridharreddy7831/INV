import prisma from '../../database/prisma';
import { createCrudService } from '../common/crud.service';
import { NotFoundError } from '../../utils/errors';

const baseCrud = createCrudService<any>('product');

/**
 * Maps frontend field values to Prisma enum values.
 * Frontend uses "In Stock", "Returnable", "Inclusive"
 * Database uses IN_STOCK, RETURNABLE, INCLUSIVE
 */
function sanitizeProductData(data: any): any {
    const clean = { ...data };

    // Map status: "In Stock" → "IN_STOCK", "Low Stock" → "LOW_STOCK", "Out of Stock" → "OUT_OF_STOCK"
    if (clean.status) {
        const statusMap: Record<string, string> = {
            'In Stock': 'IN_STOCK',
            'Low Stock': 'LOW_STOCK',
            'Out of Stock': 'OUT_OF_STOCK',
            'IN_STOCK': 'IN_STOCK',
            'LOW_STOCK': 'LOW_STOCK',
            'OUT_OF_STOCK': 'OUT_OF_STOCK',
        };
        clean.status = statusMap[clean.status] || 'IN_STOCK';
    }

    // Map taxType: "Inclusive" → "INCLUSIVE", "Exclusive" → "EXCLUSIVE"
    if (clean.taxType) {
        const taxMap: Record<string, string> = {
            'Inclusive': 'INCLUSIVE',
            'Exclusive': 'EXCLUSIVE',
            'INCLUSIVE': 'INCLUSIVE',
            'EXCLUSIVE': 'EXCLUSIVE',
        };
        clean.taxType = taxMap[clean.taxType] || 'INCLUSIVE';
    }

    // Map returns: "Returnable" → "RETURNABLE", "Not Returnable" → "NOT_RETURNABLE"
    if (clean.returns) {
        const returnsMap: Record<string, string> = {
            'Returnable': 'RETURNABLE',
            'Not Returnable': 'NOT_RETURNABLE',
            'RETURNABLE': 'RETURNABLE',
            'NOT_RETURNABLE': 'NOT_RETURNABLE',
        };
        clean.returns = returnsMap[clean.returns] || 'RETURNABLE';
    }

    // Empty strings → null for optional fields
    if (clean.image === '') clean.image = null;
    if (clean.hsnCode === '') clean.hsnCode = null;
    if (clean.expiryDate === '') clean.expiryDate = null;
    if (clean.description === '') clean.description = null;

    // Remove fields that don't exist in the schema
    delete clean.profit;
    delete clean.lastTransaction;

    // Ensure numeric types
    if (clean.price !== undefined) clean.price = Number(clean.price);
    if (clean.purchasePrice !== undefined) clean.purchasePrice = Number(clean.purchasePrice);
    if (clean.mrp !== undefined) clean.mrp = Number(clean.mrp);
    if (clean.discountPercentage !== undefined) clean.discountPercentage = Number(clean.discountPercentage);
    if (clean.stock !== undefined) clean.stock = Math.floor(Number(clean.stock));
    if (clean.minStock !== undefined) clean.minStock = Math.floor(Number(clean.minStock));
    if (clean.gstRate !== undefined) clean.gstRate = Number(clean.gstRate);

    return clean;
}

export const productService = {
    ...baseCrud,

    async create(data: any) {
        return baseCrud.create(sanitizeProductData(data));
    },

    async update(id: string, data: any) {
        return baseCrud.update(id, sanitizeProductData(data));
    },

    async bulkUpdate(products: any[]): Promise<any[]> {
        const results: any[] = [];

        await prisma.$transaction(async (tx) => {
            for (const product of products) {
                const { id, ...rawData } = product;
                if (!id) continue;

                const existing = await tx.product.findUnique({ where: { id } });
                if (!existing) continue; // Skip missing products instead of throwing

                const cleanData = sanitizeProductData(rawData);
                const updated = await tx.product.update({ where: { id }, data: cleanData });
                results.push(updated);
            }
        });

        return results;
    },

    async seed(items: any[]) {
        const sanitizedItems = items.map(sanitizeProductData);
        return baseCrud.seed(sanitizedItems);
    },
};
