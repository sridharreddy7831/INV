import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import prisma from './utils/prisma.js';
import { authenticateToken, AuthRequest } from './middleware/auth.js';

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(morgan('dev')); // Step for Observability
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // Auth routes (login, signup, profile)
app.use('/api/products', productRoutes); // Product inventory routes
app.use('/api/users', authRoutes); // Users resource mapping

// Global Error Handler (Step for Fault Tolerance)
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error(`[FATAL] Error: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Nexarats POS Backend running on port ${PORT}`);
});
