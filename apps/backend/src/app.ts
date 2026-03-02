import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { globalErrorHandler } from './middleware/errorHandler';

// Route imports
import productRouter from './modules/products/product.router';
import customerRouter from './modules/customers/customer.router';
import vendorRouter from './modules/vendors/vendor.router';
import transactionRouter from './modules/transactions/transaction.router';
import purchaseRouter from './modules/purchases/purchase.router';
import userRouter from './modules/users/user.router';
import authRouter from './modules/auth/auth.router';
import whatsappRouter from './modules/whatsapp/whatsapp.router';
import invoiceRouter from './modules/invoices/invoice.router';

const app = express();

// ─── Security ───
app.use(helmet());
const allowedOrigins = config.cors.origin.split(',').map((o) => o.trim());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
}));

// ─── Rate Limiting ───
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
});
app.use(limiter);

// ─── Body parsing ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ───
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// ─── Health Check ───
app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───
// All routes are prefixed with /api to match frontend's API_BASE
app.use('/api/products', productRouter);
app.use('/api/customers', customerRouter);
app.use('/api/vendors', vendorRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/purchases', purchaseRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/invoices', invoiceRouter);

// ─── 404 Handler ───
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ───
app.use(globalErrorHandler);

export default app;
