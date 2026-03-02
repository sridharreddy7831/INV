import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response';

export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error(`[ERROR] ${err.message}`, err.stack);

    // Prisma known errors
    if ((err as any).code === 'P2002') {
        res.status(409).json(errorResponse('A record with this value already exists'));
        return;
    }
    if ((err as any).code === 'P2025') {
        res.status(404).json(errorResponse('Record not found'));
        return;
    }

    // Zod validation errors
    if (err.name === 'ZodError') {
        const issues = (err as any).issues?.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
        res.status(400).json(errorResponse(`Validation failed: ${issues}`));
        return;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json(errorResponse('Invalid token'));
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json(errorResponse('Token expired'));
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json(errorResponse(err.message));
        return;
    }

    // Fallback
    const statusCode = (err as any).statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(statusCode).json(errorResponse(message));
}
