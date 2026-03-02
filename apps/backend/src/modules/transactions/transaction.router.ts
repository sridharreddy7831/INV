import { Router, Request, Response, NextFunction } from 'express';
import { createCrudRouter } from '../common/crud.router';
import { transactionService } from './transaction.service';

const router = Router();

// GET /transactions/source/:source — must be BEFORE CRUD /:id
router.get('/source/:source', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const source = req.params.source.toUpperCase() as 'ONLINE' | 'OFFLINE';
        const data = await transactionService.findBySource(source);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// Mount generic CRUD routes
router.use('/', createCrudRouter(transactionService, {
    filterFields: ['status', 'source', 'method'],
    seedKey: 'transactions',
}));

export default router;
