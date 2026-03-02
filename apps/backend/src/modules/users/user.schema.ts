import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(1, 'Password required'),
});

export const createUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'STAFF', 'ACCOUNTANT', 'DELIVERY_AGENT']).optional(),
    permissions: z.record(z.string()).optional(),
});
