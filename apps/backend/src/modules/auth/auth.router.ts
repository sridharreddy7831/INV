import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { validate } from '../../middleware/validate';
import { sessionGuard } from '../../middleware/auth';
import {
    sendOtpSchema, verifyOtpSchema, signupSchema,
    loginPasswordSchema, setPasswordSchema, addressSchema, wishlistSchema,
} from './auth.schema';

const router = Router();

// ─── OTP Flow ───
router.post('/send-otp', validate(sendOtpSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.sendOtp(req.body.phone);
        res.json(result);
    } catch (err) { next(err); }
});

router.post('/verify-otp', validate(verifyOtpSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.verifyOtp(req.body.phone, req.body.otp);
        res.json(result);
    } catch (err) { next(err); }
});

// ─── Signup / Login ───
router.post('/signup', validate(signupSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.signup(req.body.phone, req.body.name, req.body.password);
        res.status(201).json(result);
    } catch (err) { next(err); }
});

router.post('/login-password', validate(loginPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.loginWithPassword(req.body.phone, req.body.password);
        res.json(result);
    } catch (err) { next(err); }
});

// ─── Session ───
// Frontend calls: api.auth.checkSession(token) and expects { loggedIn: true, phone, customer }
router.get('/session', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers['x-session-token'] as string;
        if (!token) {
            res.json({ loggedIn: false });
            return;
        }
        const result = await authService.checkSession(token);
        res.json({
            loggedIn: true,
            valid: true,
            phone: result.customer?.phone || '',
            customer: result.customer,
        });
    } catch (err) {
        // Session invalid — don't error, just return logged out
        res.json({ loggedIn: false });
    }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers['x-session-token'] as string;
        const result = await authService.logout(token);
        res.json(result);
    } catch (err) { next(err); }
});

// ─── Profile (Session-guarded) ───
router.get('/profile', sessionGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getProfile(req.auth!.userId);
        res.json({ customer: result });
    } catch (err) { next(err); }
});

router.put('/profile', sessionGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.updateProfile(req.auth!.userId, req.body);
        res.json({ customer: result });
    } catch (err) { next(err); }
});

// ─── Set Password ───
router.post('/set-password', sessionGuard, validate(setPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.setPassword(req.auth!.userId, req.body.password);
        res.json(result);
    } catch (err) { next(err); }
});

// ─── Addresses ───
// Frontend expects { addresses: [...] } in responses
router.post('/addresses', sessionGuard, validate(addressSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authService.addAddress(req.auth!.userId, req.body);
        const profile = await authService.getProfile(req.auth!.userId);
        res.status(201).json({ addresses: profile.addresses || [] });
    } catch (err) { next(err); }
});

router.put('/addresses/:addrId', sessionGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authService.updateAddress(req.auth!.userId, req.params.addrId, req.body);
        const profile = await authService.getProfile(req.auth!.userId);
        res.json({ addresses: profile.addresses || [] });
    } catch (err) { next(err); }
});

router.delete('/addresses/:addrId', sessionGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authService.deleteAddress(req.auth!.userId, req.params.addrId);
        const profile = await authService.getProfile(req.auth!.userId);
        res.json({ addresses: profile.addresses || [] });
    } catch (err) { next(err); }
});

// ─── Orders ───
// Frontend expects { orders: [...] }
router.get('/orders', sessionGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getOrders(req.auth!.userId);
        res.json({ orders: result });
    } catch (err) { next(err); }
});

// ─── Store Customers (admin endpoint) ───
router.get('/store-customers', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getStoreCustomers();
        res.json(result);
    } catch (err) { next(err); }
});

// ─── Wishlist ───
// Frontend expects { wishlist: [...] }
router.get('/wishlist', sessionGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getWishlist(req.auth!.userId);
        res.json({ wishlist: result });
    } catch (err) { next(err); }
});

router.post('/wishlist', sessionGuard, validate(wishlistSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.addToWishlist(req.auth!.userId, req.body.productId);
        res.status(201).json(result);
    } catch (err) { next(err); }
});

router.delete('/wishlist/:productId', sessionGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.removeFromWishlist(req.auth!.userId, req.params.productId);
        res.json(result);
    } catch (err) { next(err); }
});

export default router;
