import { Router, Request, Response, NextFunction } from 'express';
import { purchaseService } from './purchase.service';
import { parsePagination, parseFilters } from '../../utils/query';

const router = Router();

// GET /purchases
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pagination = parsePagination(req);
        const where = parseFilters(req, ['status', 'vendorId']);
        const { data } = await purchaseService.findAll(where, pagination);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// POST /purchases
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await purchaseService.create(req.body);
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

// PUT /purchases/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await purchaseService.update(req.params.id, req.body);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// DELETE /purchases/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await purchaseService.delete(req.params.id);
        res.json({ success: true, message: 'Purchase deleted' });
    } catch (err) {
        next(err);
    }
});

export default router;
