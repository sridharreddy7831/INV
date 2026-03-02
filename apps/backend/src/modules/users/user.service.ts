import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../database/prisma';
import { createCrudService } from '../common/crud.service';
import { config } from '../../config';
import { UnauthorizedError, ConflictError } from '../../utils/errors';

const baseCrud = createCrudService<any>('user');

export const userService = {
    ...baseCrud,

    async create(data: any) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 12);
        }
        // Check uniqueness
        if (data.email) {
            const existing = await prisma.user.findUnique({ where: { email: data.email } });
            if (existing) throw new ConflictError('Email already registered');
        }
        return baseCrud.create(data);
    },

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, type: 'user' },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, type: 'refresh' },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn }
        );

        const { password: _, ...userWithoutPassword } = user;

        // Map role from DB format (SUPER_ADMIN) to frontend format (Super Admin)
        const roleMap: Record<string, string> = {
            'SUPER_ADMIN': 'Super Admin',
            'ADMIN': 'Admin',
            'MANAGER': 'Manager',
            'CASHIER': 'Cashier',
            'STAFF': 'Staff',
            'ACCOUNTANT': 'Accountant',
            'DELIVERY_AGENT': 'Delivery Agent',
        };

        const mappedUser = {
            ...userWithoutPassword,
            role: roleMap[userWithoutPassword.role] || userWithoutPassword.role,
        };

        return { success: true, user: mappedUser, token, refreshToken };
    },

    async findAll(where: any = {}, pagination?: any) {
        const result = await baseCrud.findAll(where, pagination);
        // Strip passwords from list responses
        result.data = result.data.map(({ password, ...u }: any) => u);
        return result;
    },

    async findById(id: string) {
        const user = await baseCrud.findById(id);
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },
};
