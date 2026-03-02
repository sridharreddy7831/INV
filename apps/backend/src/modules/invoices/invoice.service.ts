import PDFDocument from 'pdfkit';
import prisma from '../../database/prisma';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { NotFoundError } from '../../utils/errors';

export const invoiceService = {
    /**
     * Generate PDF from a saved transaction
     */
    async generate(transactionId: string, format: 'a4' | 'thermal' = 'a4', shopSettings?: any): Promise<Buffer> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { items: true, customer: true },
        });

        if (!transaction) throw new NotFoundError('Transaction');

        return this.buildPdf(transaction, format, shopSettings);
    },

    /**
     * Generate PDF directly from a bill object (no DB lookup)
     */
    async generateDirect(bill: any, shopSettings?: any, format: 'a4' | 'thermal' = 'a4'): Promise<Buffer> {
        return this.buildPdf(bill, format, shopSettings);
    },

    /**
     * Generate + send invoice via WhatsApp
     */
    async sendWhatsApp(bill: any, shopSettings?: any, format: 'a4' | 'thermal' = 'a4') {
        // Build a text-based receipt for WhatsApp
        const receiptLines: string[] = [];
        const shop = shopSettings || {};

        receiptLines.push(`🧾 *${shop.shopName || 'Invoice'}*`);
        receiptLines.push(`Date: ${new Date().toLocaleDateString('en-IN')}`);
        receiptLines.push('─'.repeat(30));

        const items = bill.items || [];
        for (const item of items) {
            receiptLines.push(`${item.name} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`);
        }

        receiptLines.push('─'.repeat(30));
        receiptLines.push(`*Total: ₹${bill.total || 0}*`);
        if (bill.gstAmount) receiptLines.push(`GST: ₹${bill.gstAmount}`);
        receiptLines.push(`Payment: ${bill.method || 'Cash'}`);

        const phone = bill.customer?.phone || bill.customerPhone;
        if (!phone) {
            return { success: false, message: 'No customer phone number' };
        }

        await whatsappService.sendMessage({
            to: phone,
            message: receiptLines.join('\n'),
        });

        return { success: true, message: 'Invoice sent via WhatsApp' };
    },

    /**
     * Send bulk promotional/notification messages
     */
    async sendBulkMessage(customers: any[], messageTemplate: string) {
        const messages = customers
            .filter((c: any) => c.phone)
            .map((c: any) => ({
                to: c.phone,
                message: messageTemplate
                    .replace('{{name}}', c.name || 'Customer')
                    .replace('{{phone}}', c.phone || ''),
            }));

        if (messages.length === 0) {
            return { success: true, sent: 0, message: 'No valid phone numbers' };
        }

        await whatsappService.sendBulk(messages);
        return { success: true, sent: messages.length, message: `Sent to ${messages.length} customers` };
    },

    /**
     * Build PDF buffer from transaction/bill data
     */
    buildPdf(data: any, format: 'a4' | 'thermal', shopSettings?: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const isA4 = format === 'a4';
            const pageWidth = isA4 ? 595 : 220;
            const pageHeight = isA4 ? 842 : undefined;
            const margin = isA4 ? 50 : 10;

            const doc = new PDFDocument({
                size: isA4 ? 'A4' : [pageWidth, 800],
                margin,
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const shop = shopSettings || {};
            const fontSize = isA4 ? 12 : 8;
            const titleSize = isA4 ? 20 : 12;

            // Header
            doc.fontSize(titleSize).font('Helvetica-Bold')
                .text(shop.shopName || 'Invoice', { align: 'center' });

            if (shop.address) {
                doc.fontSize(fontSize - 2).font('Helvetica')
                    .text(shop.address, { align: 'center' });
            }
            if (shop.phone) {
                doc.text(`Phone: ${shop.phone}`, { align: 'center' });
            }
            if (shop.gstNumber) {
                doc.text(`GSTIN: ${shop.gstNumber}`, { align: 'center' });
            }

            doc.moveDown();
            doc.fontSize(fontSize - 2).text('─'.repeat(isA4 ? 60 : 30));

            // Date & Customer
            doc.fontSize(fontSize).text(`Date: ${new Date(data.date || Date.now()).toLocaleDateString('en-IN')}`);
            if (data.customer?.name) {
                doc.text(`Customer: ${data.customer.name}`);
            }
            if (data.id) {
                doc.text(`Invoice #: ${data.id}`);
            }

            doc.moveDown();
            doc.text('─'.repeat(isA4 ? 60 : 30));

            // Items
            const items = data.items || [];
            for (const item of items) {
                const name = item.name || 'Item';
                const qty = item.quantity || 1;
                const price = item.price || 0;
                const total = (qty * price).toFixed(2);
                doc.text(`${name}  ×${qty}  ₹${total}`);
            }

            doc.moveDown();
            doc.text('─'.repeat(isA4 ? 60 : 30));

            // Totals
            doc.font('Helvetica-Bold');
            if (data.gstAmount) {
                doc.text(`GST: ₹${Number(data.gstAmount).toFixed(2)}`);
            }
            doc.fontSize(fontSize + 2).text(`Total: ₹${Number(data.total || 0).toFixed(2)}`);
            doc.font('Helvetica').fontSize(fontSize);
            doc.text(`Payment: ${data.method || 'Cash'}`);

            doc.moveDown(2);
            doc.fontSize(fontSize - 2).text('Thank you for your business!', { align: 'center' });

            doc.end();
        });
    },
};
