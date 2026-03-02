import { Router } from 'express';
import { createCrudRouter } from '../common/crud.router';
import { customerService } from './customer.service';

const router = Router();
router.use('/', createCrudRouter(customerService, {
    filterFields: ['status', 'channel'],
    seedKey: 'customers',
}));

export default router;
