import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../database/prisma';
import { config } from '../../config';
import { UnauthorizedError, NotFoundError, ConflictError, ValidationError } from '../../utils/errors';

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authService = {
    // ─── OTP ───
    async sendOtp(phone: string) {
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

        // Invalidate any existing OTPs for this phone
        await prisma.otpRecord.updateMany({
            where: { phone, verified: false },
            data: { verified: true },
        });

        await prisma.otpRecord.create({
            data: { phone, otp, expiresAt },
        });

        // In production, send via WhatsApp/SMS. For dev, return in response.
        console.log(`[OTP] ${phone} → ${otp}`);

        return {
            message: 'OTP sent successfully',
            ...(config.nodeEnv === 'development' && { otp }), // Only in dev
        };
    },

    async verifyOtp(phone: string, otp: string) {
        const record = await prisma.otpRecord.findFirst({
            where: { phone, otp, verified: false, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });

        if (!record) {
            throw new UnauthorizedError('Invalid or expired OTP');
        }

        await prisma.otpRecord.update({
            where: { id: record.id },
            data: { verified: true },
        });

        // Create or find customer
        let customer = await prisma.customer.findUnique({ where: { phone } });
        if (!customer) {
            customer = await prisma.customer.create({
                data: { name: '', phone, channel: 'ONLINE' },
            });
        }

        // Create session token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await prisma.session.create({
            data: { token, userId: customer.id, expiresAt },
        });

        return { token, customer };
    },

    // ─── Signup with password ───
    async signup(phone: string, name: string, password: string) {
        const existing = await prisma.customer.findUnique({ where: { phone } });
        if (existing && existing.password) {
            throw new ConflictError('Account already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        let customer;
        if (existing) {
            customer = await prisma.customer.update({
                where: { phone },
                data: { name, password: hashedPassword, channel: 'ONLINE' },
            });
        } else {
            customer = await prisma.customer.create({
                data: { name, phone, password: hashedPassword, channel: 'ONLINE' },
            });
        }

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.session.create({ data: { token, userId: customer.id, expiresAt } });

        const { password: _, ...safeCustomer } = customer;
        return { token, customer: safeCustomer };
    },

    // ─── Login with password ───
    async loginWithPassword(phone: string, password: string) {
        const customer = await prisma.customer.findUnique({ where: { phone } });
        if (!customer || !customer.password) {
            throw new UnauthorizedError('Invalid phone or password');
        }

        const valid = await bcrypt.compare(password, customer.password);
        if (!valid) {
            throw new UnauthorizedError('Invalid phone or password');
        }

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.session.create({ data: { token, userId: customer.id, expiresAt } });

        await prisma.customer.update({
            where: { id: customer.id },
            data: { lastLogin: new Date() },
        });

        const { password: _, ...safeCustomer } = customer;
        return { token, customer: safeCustomer };
    },

    // ─── Set Password ───
    async setPassword(customerId: string, password: string) {
        if (password.length < 6) throw new ValidationError('Password must be at least 6 characters');
        const hashed = await bcrypt.hash(password, 12);
        await prisma.customer.update({
            where: { id: customerId },
            data: { password: hashed },
        });
        return { message: 'Password set successfully' };
    },

    // ─── Session ───
    async checkSession(token: string) {
        const session = await prisma.session.findUnique({ where: { token } });
        if (!session || session.expiresAt < new Date()) {
            throw new UnauthorizedError('Session expired or invalid');
        }
        const customer = await prisma.customer.findUnique({
            where: { id: session.userId },
            include: { addresses: true, wishlist: { include: { product: true } } },
        });
        if (!customer) throw new NotFoundError('Customer');
        const { password, ...safe } = customer;
        return { valid: true, customer: safe };
    },

    async logout(token: string) {
        await prisma.session.deleteMany({ where: { token } });
        return { message: 'Logged out successfully' };
    },

    // ─── Profile ───
    async getProfile(customerId: string) {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { addresses: true, wishlist: { include: { product: true } } },
        });
        if (!customer) throw new NotFoundError('Customer');
        const { password, ...safe } = customer;
        return safe;
    },

    async updateProfile(customerId: string, data: any) {
        const { password, id, ...updateData } = data;
        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: updateData,
        });
        const { password: _, ...safe } = customer;
        return safe;
    },

    // ─── Addresses ───
    async addAddress(customerId: string, address: any) {
        // If first address or isDefault, unset other defaults
        if (address.isDefault) {
            await prisma.address.updateMany({
                where: { customerId },
                data: { isDefault: false },
            });
        }
        return prisma.address.create({
            data: { ...address, customerId },
        });
    },

    async updateAddress(customerId: string, addressId: string, data: any) {
        const addr = await prisma.address.findFirst({ where: { id: addressId, customerId } });
        if (!addr) throw new NotFoundError('Address');
        if (data.isDefault) {
            await prisma.address.updateMany({ where: { customerId }, data: { isDefault: false } });
        }
        return prisma.address.update({ where: { id: addressId }, data });
    },

    async deleteAddress(customerId: string, addressId: string) {
        const addr = await prisma.address.findFirst({ where: { id: addressId, customerId } });
        if (!addr) throw new NotFoundError('Address');
        await prisma.address.delete({ where: { id: addressId } });
        return { message: 'Address deleted' };
    },

    // ─── Orders ───
    async getOrders(customerId: string) {
        return prisma.order.findMany({
            where: { customerId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    },

    // ─── Store Customers ───
    async getStoreCustomers() {
        const customers = await prisma.customer.findMany({
            where: { channel: { in: ['ONLINE', 'BOTH'] }, deletedAt: null },
            include: { addresses: true, wishlist: true, orders: { select: { id: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return customers.map(({ password, ...c }: any) => ({
            ...c,
            totalOrders: c.orders?.length || 0,
        }));
    },

    // ─── Wishlist ───
    async getWishlist(customerId: string) {
        const items = await prisma.wishlist.findMany({
            where: { customerId },
            include: { product: true },
            orderBy: { addedAt: 'desc' },
        });
        return items;
    },

    async addToWishlist(customerId: string, productId: string) {
        return prisma.wishlist.upsert({
            where: { customerId_productId: { customerId, productId } },
            create: { customerId, productId },
            update: {},
            include: { product: true },
        });
    },

    async removeFromWishlist(customerId: string, productId: string) {
        await prisma.wishlist.deleteMany({ where: { customerId, productId } });
        return { message: 'Removed from wishlist' };
    },
};
