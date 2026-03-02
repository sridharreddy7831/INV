import { Router, Request, Response, NextFunction } from 'express';
import { createCrudRouter } from '../common/crud.router';
import { userService } from './user.service';
import { validate } from '../../middleware/validate';
import { loginSchema } from './user.schema';

const router = Router();

// POST /users/login — must be BEFORE CRUD to avoid /:id conflict
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await userService.login(email, password);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Mount generic CRUD routes
router.use('/', createCrudRouter(userService, {
    filterFields: ['role'],
    seedKey: 'users',
}));

export default router;
