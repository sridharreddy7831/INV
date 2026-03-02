import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    sku: z.string().min(1, 'SKU is required'),
    category: z.string().min(1, 'Category is required'),
    price: z.number().min(0),
    purchasePrice: z.number().min(0),
    mrp: z.number().min(0).optional().default(0),
    discountPercentage: z.number().min(0).max(100).optional().default(0),
    stock: z.number().int().min(0).optional().default(0),
    minStock: z.number().int().min(0).optional().default(0),
    gstRate: z.number().min(0).max(100).optional().default(18),
    hsnCode: z.string().optional(),
    unit: z.string().optional().default('Pieces'),
    status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
    taxType: z.enum(['INCLUSIVE', 'EXCLUSIVE']).optional().default('INCLUSIVE'),
    returns: z.enum(['RETURNABLE', 'NOT_RETURNABLE']).optional().default('RETURNABLE'),
    image: z.string().url().optional().nullable(),
    description: z.string().optional(),
    expiryDate: z.string().datetime().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkUpdateSchema = z.object({
    products: z.array(z.object({
        id: z.string(),
    }).passthrough()).min(1),
});
