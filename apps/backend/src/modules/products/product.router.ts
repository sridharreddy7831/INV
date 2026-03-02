import { Router, Request, Response, NextFunction } from 'express';
import { createCrudRouter } from '../common/crud.router';
import { productService } from './product.service';
import { validate } from '../../middleware/validate';
import { bulkUpdateSchema } from './product.schema';

const router = Router();

// PUT /products/bulk/update — must be BEFORE CRUD /:id to avoid conflict
router.put('/bulk/update', validate(bulkUpdateSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await productService.bulkUpdate(req.body.products);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Mount generic CRUD routes
const crudRouter = createCrudRouter(productService, {
    filterFields: ['category', 'status', 'taxType'],
    seedKey: 'products',
});
router.use('/', crudRouter);

export default router;
