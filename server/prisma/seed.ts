import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SEEDING NEXARATS POS ---');

    // Create Admin User
    const adminPassword = 'Password@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@nexarats.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@nexarats.com',
            phone: '9999999999',
            password: hashedPassword,
            role: 'Admin',
            permissions: JSON.stringify({
                products: 'manage',
                customers: 'manage',
                vendors: 'manage',
                transactions: 'manage',
                purchases: 'manage',
                users: 'manage',
                settings: 'manage',
                analytics: 'manage',
            }),
        },
    });

    console.log(`[SUCCESS] Admin created: ${admin.email}`);
    console.log(`[AUTH] Login with: admin@nexarats.com / ${adminPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
