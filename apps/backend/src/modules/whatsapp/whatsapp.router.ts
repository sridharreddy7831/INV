import { Router, Request, Response, NextFunction } from 'express';
import { whatsappService } from './whatsapp.service';

const router = Router();

// GET /whatsapp/status
router.get('/status', async (_req: Request, res: Response) => {
    try {
        const data = await whatsappService.getStatus();
        // Frontend expects { success: true, data: { status, connectionInfo, ... } }
        res.json({ success: true, data });
    } catch (err: any) {
        res.json({
            success: true,
            data: {
                status: 'disconnected',
                connected: false,
                message: err.message || 'WhatsApp service unavailable',
            },
        });
    }
});

// GET /whatsapp/qr
router.get('/qr', async (_req: Request, res: Response) => {
    try {
        const data = await whatsappService.getQr();
        // Frontend expects { success: true, qr: "base64..." }
        // The upstream API returns { action: "qr", qr: "base64..." }
        res.json({
            success: true,
            qr: data.qr || null,
        });
    } catch (err: any) {
        res.json({
            success: false,
            qr: null,
            message: 'QR not available yet',
        });
    }
});

// POST /whatsapp/pair
router.post('/pair', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await whatsappService.requestPairingCode(req.body.phoneNumber || req.body.phone);
        // Frontend expects { success: true, pairingCode: "..." }
        res.json({
            success: true,
            pairingCode: data.code || data.pairingCode || null,
            message: data.message || 'Pairing code generated'
        });
    } catch (err) { next(err); }
});

// POST /whatsapp/send
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { to, phone, message, ...rest } = req.body;
        const data = await whatsappService.sendMessage({ phone: to || phone, message, ...rest });
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// POST /whatsapp/send-receipt
router.post('/send-receipt', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { to, phone, receipt } = req.body;
        const data = await whatsappService.sendReceipt(to || phone, receipt);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// POST /whatsapp/send-bulk
router.post('/send-bulk', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await whatsappService.sendBulk(req.body.messages);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// GET /whatsapp/messages
router.get('/messages', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = req.query as Record<string, any>;
        const data = await whatsappService.getMessages({
            phone: params.phone,
            limit: params.limit ? parseInt(params.limit) : undefined,
        });
        res.json({ success: true, data: data.messages || data.data || data });
    } catch (err) { next(err); }
});


// POST /whatsapp/logout
router.post('/logout', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await whatsappService.logout();
        res.json({ success: true, ...data });
    } catch (err) { next(err); }
});

// POST /whatsapp/restart
router.post('/restart', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await whatsappService.restart();
        res.json({ success: true, ...data });
    } catch (err) { next(err); }
});

export default router;
