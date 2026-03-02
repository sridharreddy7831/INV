import { Router, Request, Response, NextFunction } from 'express';
import { invoiceService } from './invoice.service';

const router = Router();

// POST /invoices/generate — Generate PDF from transaction ID
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { transactionId, format = 'a4', shopSettings } = req.body;
        const pdfBuffer = await invoiceService.generate(transactionId, format, shopSettings);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="invoice-${transactionId}.pdf"`,
            'Content-Length': String(pdfBuffer.length),
        });
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
});

// POST /invoices/generate-direct — Generate PDF from bill object
router.post('/generate-direct', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bill, shopSettings, format = 'a4' } = req.body;
        const pdfBuffer = await invoiceService.generateDirect(bill, shopSettings, format);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="invoice.pdf"',
            'Content-Length': String(pdfBuffer.length),
        });
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
});

// POST /invoices/send-whatsapp — Send invoice via WhatsApp
router.post('/send-whatsapp', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bill, shopSettings, format } = req.body;
        const result = await invoiceService.sendWhatsApp(bill, shopSettings, format);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// POST /invoices/send-bulk-message — Send bulk messages
router.post('/send-bulk-message', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customers, messageTemplate } = req.body;
        const result = await invoiceService.sendBulkMessage(customers, messageTemplate);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
