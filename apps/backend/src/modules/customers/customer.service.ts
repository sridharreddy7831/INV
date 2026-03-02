import { createCrudService } from '../common/crud.service';

const baseCrud = createCrudService<any>('customer');

/**
 * Maps frontend values to Prisma enum values for customers.
 */
function sanitizeCustomerData(data: any): any {
    const clean = { ...data };

    // Map status: "Paid" → "PAID" etc.
    if (clean.status) {
        const statusMap: Record<string, string> = {
            'Paid': 'PAID', 'paid': 'PAID', 'PAID': 'PAID',
            'Unpaid': 'UNPAID', 'unpaid': 'UNPAID', 'UNPAID': 'UNPAID',
            'Partial': 'PARTIAL', 'partial': 'PARTIAL', 'PARTIAL': 'PARTIAL',
        };
        clean.status = statusMap[clean.status] || 'PAID';
    }

    // Map channel: "both" → "BOTH", "online" → "ONLINE", "offline" → "OFFLINE"
    if (clean.channel) {
        const channelMap: Record<string, string> = {
            'both': 'BOTH', 'Both': 'BOTH', 'BOTH': 'BOTH',
            'online': 'ONLINE', 'Online': 'ONLINE', 'ONLINE': 'ONLINE',
            'offline': 'OFFLINE', 'Offline': 'OFFLINE', 'OFFLINE': 'OFFLINE',
        };
        clean.channel = channelMap[clean.channel] || 'OFFLINE';
    }

    // Ensure numeric types
    if (clean.totalPaid !== undefined) clean.totalPaid = Number(clean.totalPaid);
    if (clean.pending !== undefined) clean.pending = Number(clean.pending);
    if (clean.totalSpent !== undefined) clean.totalSpent = Number(clean.totalSpent);
    if (clean.totalOrders !== undefined) clean.totalOrders = Math.floor(Number(clean.totalOrders));
    if (clean.totalInvoices !== undefined) clean.totalInvoices = Math.floor(Number(clean.totalInvoices));

    // Empty strings → null
    if (clean.email === '') clean.email = null;
    if (clean.address === '') clean.address = null;

    return clean;
}

export const customerService = {
    ...baseCrud,

    async create(data: any) {
        return baseCrud.create(sanitizeCustomerData(data));
    },

    async update(id: string, data: any) {
        return baseCrud.update(id, sanitizeCustomerData(data));
    },

    async seed(items: any[]) {
        return baseCrud.seed(items.map(sanitizeCustomerData));
    },
};
