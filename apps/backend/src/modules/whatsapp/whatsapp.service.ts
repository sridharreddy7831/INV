import { config } from '../../config';
import { ExternalServiceError } from '../../utils/errors';

const WA_BASE = config.whatsapp.apiUrl;
const WA_ENDPOINT = `${WA_BASE}/api/whatsapp`;

// Use a stable session ID so the backend can reconnect to existing sessions across restarts
const RUNTIME_SESSION_ID = config.whatsapp.sessionId || 'nexarats';

/**
 * WhatsApp Unified API Layer (RPC)
 */
async function waRpc<T = any>(payload: Record<string, any>, retries = 1): Promise<T> {
    if (!payload.sessionId) {
        payload.sessionId = RUNTIME_SESSION_ID;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(WA_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const contentType = res.headers.get('content-type') || '';
            const body = contentType.includes('application/json')
                ? await res.json()
                : await res.text();

            if (!res.ok) {
                const errorMsg = typeof body === 'object' && body !== null ? (body as any).error || JSON.stringify(body) : body;
                throw new ExternalServiceError('WhatsApp', `${res.status}: ${errorMsg}`);
            }

            return (typeof body === 'object' && body !== null ? body : { success: true }) as T;
        } catch (err: any) {
            lastError = err;
            if (err.message?.includes('404')) break; // Session not found
            if (attempt < retries) {
                await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
        }
    }

    throw lastError || new ExternalServiceError('WhatsApp', 'Request failed');
}

export const whatsappService = {
    async start(sessionId?: string) {
        return waRpc({ action: 'start', sessionId });
    },

    async getStatus(sessionId?: string) {
        try {
            return await waRpc({ action: 'status', sessionId });
        } catch (err: any) {
            if (err.message?.includes('404') || err.message?.includes('Session not found')) {
                console.log('[WhatsApp] No session found — auto-starting...');
                try {
                    await this.start(sessionId);
                    return await waRpc({ action: 'status', sessionId });
                } catch {
                    return { status: 'disconnected', connected: false, message: 'Session started but not yet connected' };
                }
            }
            throw err;
        }
    },

    async getQr(sessionId?: string) {
        try {
            return await waRpc({ action: 'qr', sessionId });
        } catch (err: any) {
            if (err.message?.includes('404') || err.message?.includes('Session not found')) {
                try {
                    await this.start(sessionId);
                    return await waRpc({ action: 'qr', sessionId });
                } catch {
                    return { qr: null, message: 'Session started — wait for QR' };
                }
            }
            throw err;
        }
    },

    async requestPairingCode(phone: string, sessionId?: string) {
        try {
            return await waRpc({ action: 'pair', phone, sessionId });
        } catch (err: any) {
            if (err.message?.includes('Session not found')) {
                await this.start(sessionId);
                return await waRpc({ action: 'pair', phone, sessionId });
            }
            throw err;
        }
    },

    async sendMessage(data: { phone: string; message: string; sessionId?: string }) {
        return waRpc({
            action: 'send',
            phone: data.phone,
            message: data.message,
            sessionId: data.sessionId,
        }, 2);
    },

    async sendReceipt(phone: string, receipt: any, sessionId?: string) {
        return waRpc({
            action: 'send-receipt',
            phone,
            base64Data: receipt.base64Data || receipt.data || '',
            mimetype: receipt.mimetype || 'application/pdf',
            filename: receipt.filename || 'invoice.pdf',
            caption: receipt.caption || 'Here is your receipt!',
            sessionId,
        }, 2);
    },

    async sendBulk(messages: { phone: string; message: string }[], sessionId?: string) {
        return waRpc({ action: 'send-bulk', messages, sessionId });
    },

    async getMessages(params?: { phone?: string; limit?: number; sessionId?: string }) {
        return waRpc({
            action: 'messages',
            phone: params?.phone,
            limit: params?.limit || 50,
            sessionId: params?.sessionId,
        });
    },

    async logout(sessionId?: string) {
        return waRpc({ action: 'logout', sessionId });
    },

    async restart(sessionId?: string) {
        try { await this.logout(sessionId); } catch { /* ignore */ }
        return this.start(sessionId);
    }
};
