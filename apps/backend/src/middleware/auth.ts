import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import prisma from '../database/prisma';

export interface AuthPayload {
    userId: string;
    role: string;
    type: 'user' | 'customer';
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthPayload;
        }
    }
}

/**
 * JWT-based authentication for admin/staff users (Authorization: Bearer ...)
 */
export function authGuard(req: Request, _res: Response, next: NextFunction): void {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
        req.auth = decoded;
        next();
    } catch (err: any) {
        if (err instanceof UnauthorizedError) {
            next(err);
        } else {
            next(new UnauthorizedError(err.message || 'Invalid token'));
        }
    }
}

/**
 * Session-token based auth for store customers (X-Session-Token header)
 */
export async function sessionGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const token = req.headers['x-session-token'] as string;
        if (!token) {
            throw new UnauthorizedError('No session token provided');
        }

        const session = await prisma.session.findUnique({ where: { token } });
        if (!session || session.expiresAt < new Date()) {
            if (session) {
                await prisma.session.delete({ where: { id: session.id } });
            }
            throw new UnauthorizedError('Session expired or invalid');
        }

        req.auth = { userId: session.userId, role: 'CUSTOMER', type: 'customer' };
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Flexible auth: tries Bearer JWT first, then X-Session-Token
 */
export async function flexibleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const hasBearerToken = req.headers.authorization?.startsWith('Bearer ');
    const hasSessionToken = !!req.headers['x-session-token'];

    if (hasBearerToken) {
        return authGuard(req, res, next);
    }
    if (hasSessionToken) {
        return sessionGuard(req, res, next);
    }
    next(new UnauthorizedError('No authentication credentials provided'));
}

/**
 * Role-based access control middleware factory
 */
export function requireRole(...roles: string[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.auth) {
            return next(new UnauthorizedError());
        }
        if (!roles.includes(req.auth.role)) {
            return next(new ForbiddenError(`Requires one of: ${roles.join(', ')}`));
        }
        next();
    };
}

/**
 * Optional auth — attaches user info if available, but doesn't reject
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    try {
        const header = req.headers.authorization;
        if (header?.startsWith('Bearer ')) {
            const token = header.split(' ')[1];
            const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
            req.auth = decoded;
        }
    } catch {
        // Silently ignore — optional
    }
    next();
}
