import app from './app';
import { config } from './config';
import prisma from './database/prisma';

async function bootstrap() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected');

        app.listen(config.port, () => {
            console.log(`
┌─────────────────────────────────────────────┐
│                                             │
│   🚀  NexaRats Backend API                  │
│                                             │
│   Port:  ${String(config.port).padEnd(35)}│
│   Env:   ${config.nodeEnv.padEnd(35)}│
│   API:   http://localhost:${config.port}/api${' '.repeat(13)}│
│                                             │
└─────────────────────────────────────────────┘
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

bootstrap();
