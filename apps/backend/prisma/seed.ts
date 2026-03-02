import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...\n');

    // ─── Admin Users ───
    const password = await bcrypt.hash('admin123', 12);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'surya@nexarats.com' },
        update: {},
        create: {
            name: 'Surya Teja',
            email: 'surya@nexarats.com',
            phone: '9999999999',
            password,
            role: 'SUPER_ADMIN',
            permissions: {
                dashboard: 'manage', billing: 'manage', inventory: 'manage',
                customers: 'manage', vendors: 'manage', analytics: 'manage',
                settings: 'manage', 'online-store': 'manage', admin: 'manage',
            },
        },
    });
    console.log(`  ✅ Super Admin: ${superAdmin.email}`);

    const manager = await prisma.user.upsert({
        where: { email: 'saisurya7989@gmail.com' },
        update: {},
        create: {
            name: 'Rahul Kumar',
            email: 'saisurya7989@gmail.com',
            phone: '8888888888',
            password,
            role: 'MANAGER',
            permissions: {
                dashboard: 'read', billing: 'manage', inventory: 'manage',
                customers: 'manage', vendors: 'manage', analytics: 'manage',
                settings: 'none', 'online-store': 'manage', admin: 'read',
            },
        },
    });
    console.log(`  ✅ Manager:     ${manager.email}`);

    // ─── Products ───
    const products = [
        {
            id: 'prod_1',
            name: 'Organic Almond Milk',
            sku: 'AMK-001',
            category: 'Dairy',
            price: 249,
            purchasePrice: 180,
            mrp: 299,
            discountPercentage: 17,
            stock: 45,
            minStock: 10,
            gstRate: 5,
            unit: 'Litre',
            status: 'IN_STOCK' as const,
            taxType: 'INCLUSIVE' as const,
            returns: 'RETURNABLE' as const,
            image: 'https://images.unsplash.com/photo-1550583724-125581cc25fb?auto=format&fit=crop&q=80&w=800',
            description: 'Pure organic almond milk, unsweetened and rich in Vitamin E.',
        },
        {
            id: 'prod_2',
            name: 'Premium Arabica Coffee',
            sku: 'COF-772',
            category: 'Beverages',
            price: 899,
            purchasePrice: 650,
            mrp: 1200,
            discountPercentage: 25,
            stock: 22,
            minStock: 5,
            gstRate: 12,
            unit: 'Pack',
            status: 'IN_STOCK' as const,
            taxType: 'INCLUSIVE' as const,
            returns: 'RETURNABLE' as const,
            image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800',
            description: 'Single-origin Arabica beans, medium roast.',
        },
        {
            id: 'prod_3',
            name: 'Smart Noise Cancelling Buds',
            sku: 'EBS-990',
            category: 'Electronics',
            price: 4999,
            purchasePrice: 3800,
            mrp: 6999,
            discountPercentage: 28,
            stock: 8,
            minStock: 10,
            gstRate: 18,
            unit: 'Pieces',
            status: 'LOW_STOCK' as const,
            taxType: 'INCLUSIVE' as const,
            returns: 'RETURNABLE' as const,
            image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800',
            description: 'Next-gen wireless earbuds with ANC and 30-hour battery.',
        },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { sku: product.sku },
            update: {},
            create: product,
        });
    }
    console.log(`  ✅ Products:    ${products.length} seeded`);

    // ─── Customers ───
    const customer = await prisma.customer.upsert({
        where: { phone: '9876543210' },
        update: {},
        create: {
            id: 'cust_1',
            name: 'Rahul Sharma',
            email: 'rahul@example.com',
            phone: '9876543210',
            totalPaid: 12450,
            pending: 0,
            status: 'PAID',
            channel: 'OFFLINE',
            totalInvoices: 5,
        },
    });
    console.log(`  ✅ Customer:    ${customer.name}`);

    // ─── Vendors ───
    const vendor = await prisma.vendor.upsert({
        where: { phone: '1800999999' },
        update: {},
        create: {
            id: 'vend_1',
            name: 'Global Electronics Ltd',
            businessName: 'Global Electronics PVT LTD',
            gstNumber: '29AAAAA0000A1Z5',
            email: 'supply@globalelec.com',
            phone: '1800999999',
            totalPaid: 45000,
            pendingAmount: 12000,
            totalInvoices: 12,
        },
    });
    console.log(`  ✅ Vendor:      ${vendor.name}`);

    console.log('\n✅ Seeding complete!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
