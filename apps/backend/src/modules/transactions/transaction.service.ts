import prisma from '../../database/prisma';
import { createCrudService } from '../common/crud.service';

const baseCrud = createCrudService<any>('transaction');

/**
 * Maps frontend values to Prisma enum values for transactions.
 */
function sanitizeTransactionData(data: any): any {
    const clean = { ...data };

    // Map method: "cash" → "CASH", "upi" → "UPI" etc.
    if (clean.method) {
        const methodMap: Record<string, string> = {
            'cash': 'CASH', 'Cash': 'CASH', 'CASH': 'CASH',
            'upi': 'UPI', 'UPI': 'UPI',
            'card': 'CARD', 'Card': 'CARD', 'CARD': 'CARD',
            'split': 'SPLIT', 'Split': 'SPLIT', 'SPLIT': 'SPLIT',
            'bank_transfer': 'BANK_TRANSFER', 'Bank Transfer': 'BANK_TRANSFER', 'BANK_TRANSFER': 'BANK_TRANSFER',
        };
        clean.method = methodMap[clean.method] || 'CASH';
    }

    // Map status: "Paid" → "PAID" etc.
    if (clean.status) {
        const statusMap: Record<string, string> = {
            'Paid': 'PAID', 'paid': 'PAID', 'PAID': 'PAID',
            'Unpaid': 'UNPAID', 'unpaid': 'UNPAID', 'UNPAID': 'UNPAID',
            'Partial': 'PARTIAL', 'partial': 'PARTIAL', 'PARTIAL': 'PARTIAL',
        };
        clean.status = statusMap[clean.status] || 'PAID';
    }

    // Map source: "online" → "ONLINE" etc.
    if (clean.source) {
        clean.source = clean.source.toUpperCase();
    }

    // Map orderStatus
    if (clean.orderStatus) {
        const orderMap: Record<string, string> = {
            'Pending': 'PENDING', 'pending': 'PENDING', 'PENDING': 'PENDING',
            'Confirmed': 'CONFIRMED', 'confirmed': 'CONFIRMED', 'CONFIRMED': 'CONFIRMED',
            'Shipped': 'SHIPPED', 'shipped': 'SHIPPED', 'SHIPPED': 'SHIPPED',
            'Delivered': 'DELIVERED', 'delivered': 'DELIVERED', 'DELIVERED': 'DELIVERED',
            'Cancelled': 'CANCELLED', 'cancelled': 'CANCELLED', 'CANCELLED': 'CANCELLED',
        };
        clean.orderStatus = orderMap[clean.orderStatus] || clean.orderStatus;
    }

    // Ensure numeric types
    if (clean.total !== undefined) clean.total = Number(clean.total);
    if (clean.gstAmount !== undefined) clean.gstAmount = Number(clean.gstAmount);
    if (clean.paidAmount !== undefined) clean.paidAmount = Number(clean.paidAmount);

    // Remove fields that don't exist in the schema
    delete clean.customerName;
    delete clean.customerPhone;
    delete clean.deliveryAddress;

    return clean;
}

export const transactionService = {
    ...baseCrud,

    async findBySource(source: 'ONLINE' | 'OFFLINE') {
        return prisma.transaction.findMany({
            where: { source, deletedAt: null },
            include: { items: true, customer: true },
            orderBy: { createdAt: 'desc' },
        });
    },

    async findAll(where: any = {}, pagination?: any) {
        return baseCrud.findAll(where, pagination, { items: true, customer: true });
    },

    async findById(id: string) {
        return baseCrud.findById(id, { items: true, customer: true });
    },

    async create(data: any) {
        const { items, ...rawTransactionData } = data;
        const transactionData = sanitizeTransactionData(rawTransactionData);

        return prisma.transaction.create({
            data: {
                ...transactionData,
                items: items ? {
                    create: items.map((item: any) => ({
                        productId: item.productId || item.id,
                        name: item.name,
                        quantity: Math.floor(Number(item.quantity || item.qty || 1)),
                        price: Number(item.price),
                        gst: Number(item.gst || 0),
                    })),
                } : undefined,
            },
            include: { items: true },
        });
    },

    async update(id: string, data: any) {
        return baseCrud.update(id, sanitizeTransactionData(data));
    },
};
