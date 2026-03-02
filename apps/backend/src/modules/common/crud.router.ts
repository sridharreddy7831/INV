import { Router, Request, Response, NextFunction } from 'express';
import { parsePagination, parseFilters } from '../../utils/query';

/**
 * Generic CRUD router factory.
 * 
 * IMPORTANT: Returns raw data (not wrapped) to match frontend expectations.
 * The frontend's api.ts expects direct arrays/objects from responses.
 */
export function createCrudRouter(
    service: any,
    options: {
        filterFields?: string[];
        seedKey?: string;
    } = {}
): Router {
    const router = Router();

    // GET / — List all with pagination & filtering
    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const pagination = parsePagination(req);
            const where = parseFilters(req, options.filterFields || []);
            const { data } = await service.findAll(where, pagination);
            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    // GET /:id — Get one
    router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await service.findById(req.params.id);
            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    // POST / — Create
    router.post('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await service.create(req.body);
            res.status(201).json(data);
        } catch (err) {
            next(err);
        }
    });

    // PUT /:id — Update
    router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await service.update(req.params.id, req.body);
            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    // DELETE /:id — Soft delete
    router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            await service.delete(req.params.id);
            res.json({ success: true, message: 'Deleted successfully' });
        } catch (err) {
            next(err);
        }
    });

    // POST /seed — Seed data
    router.post('/seed', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const key = options.seedKey || 'items';
            const items = req.body[key] || req.body.items || [];
            const result = await service.seed(items);

            // After seeding, return the full list so frontend can use it directly
            const { data: allData } = await service.findAll({ deletedAt: null });
            res.json({ success: true, [key]: allData, ...result });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
