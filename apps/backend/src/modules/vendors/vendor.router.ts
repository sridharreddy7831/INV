import { Router } from 'express';
import { createCrudRouter } from '../common/crud.router';
import { vendorService } from './vendor.service';

const router = Router();
router.use('/', createCrudRouter(vendorService, {
    filterFields: ['gstNumber'],
    seedKey: 'vendors',
}));

export default router;
