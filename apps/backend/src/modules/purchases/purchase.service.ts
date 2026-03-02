import { createCrudService } from '../common/crud.service';

const baseCrud = createCrudService<any>('purchase');

function sanitizePurchaseData(data: any): any {
    const clean = { ...data };

    if (clean.status) {
        const statusMap: Record<string, string> = {
            'Paid': 'PAID', 'paid': 'PAID', 'PAID': 'PAID',
            'Unpaid': 'UNPAID', 'unpaid': 'UNPAID', 'UNPAID': 'UNPAID',
            'Partial': 'PARTIAL', 'partial': 'PARTIAL', 'PARTIAL': 'PARTIAL',
        };
        clean.status = statusMap[clean.status] || 'UNPAID';
    }

    if (clean.amount !== undefined) clean.amount = Number(clean.amount);

    return clean;
}

export const purchaseService = {
    ...baseCrud,

    async create(data: any) {
        return baseCrud.create(sanitizePurchaseData(data));
    },

    async update(id: string, data: any) {
        return baseCrud.update(id, sanitizePurchaseData(data));
    },
};
