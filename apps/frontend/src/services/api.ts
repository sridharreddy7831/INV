const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const IS_PROD = import.meta.env.PROD;

const mockDb = {
    get: (key: string) => JSON.parse(localStorage.getItem(`inv_${key}`) || '[]'),
    save: (key: string, data: any) => localStorage.setItem(`inv_${key}`, JSON.stringify(data))
};

/**
 * request wrapper with Auth and Error handling
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const sessionToken = sessionStorage.getItem('inv_token');

    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options?.headers
    });

    if (sessionToken) {
        headers.set('Authorization', `Bearer ${sessionToken}`);
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || err.message || `API Error: ${res.status}`);
        }
        return res.json();
    } catch (error: any) {
        // Only fallback to LocalStorage if explicitly allowed and backend is down
        const isNetworkError = error.message === 'Failed to fetch' || error.message.includes('API Unreachable');

        if (isNetworkError && !IS_PROD) {
            console.warn(`[RECOVERY] API Unreachable (${endpoint}). Falling back to LocalStorage Mock.`);

            // SECURITY: Never mock Auth/User data in local storage for protection
            if (endpoint.includes('/auth') || endpoint.includes('/users')) {
                throw new Error('Authentication requires a secure backend connection.');
            }

            const path = endpoint.split('?')[0].split('/')[1];
            const method = options?.method || 'GET';
            const body = options?.body ? JSON.parse(options.body as string) : null;
            const segments = endpoint.split('/').filter(Boolean);

            if (method === 'GET' && segments.length === 1) return mockDb.get(path) as T;
            if (method === 'POST' && endpoint.endsWith('/seed')) {
                const seedKey = endpoint.includes('products') ? 'products' : path;
                const seedData = body[seedKey] || [];
                const merged = [...mockDb.get(path)];
                seedData.forEach((item: any) => {
                    if (!merged.find((m: any) => m.id === item.id)) merged.push(item);
                });
                mockDb.save(path, merged);
                return { success: true, [path]: merged } as any;
            }
            // Standard Mock CRUD
            if (method === 'POST') {
                const data = mockDb.get(path);
                const newItem = { ...body, id: body.id || `item_${Date.now()}` };
                mockDb.save(path, [newItem, ...data]);
                return newItem as T;
            }
        }
        throw error;
    }
}

/**
 * Layer 2: Resource Factory (Layering Pattern)
 * Reduces repetition for standard CRUD operations.
 */
const createResource = <T>(path: string, seedKey?: string) => ({
    getAll: () => request<T[]>(path),
    getOne: (id: string) => request<T>(`${path}/${id}`),
    create: (data: any) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<T>(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`${path}/${id}`, { method: 'DELETE' }),
    seed: (items?: any[]) => request<any>(`${path}/seed`, {
        method: 'POST',
        body: items ? JSON.stringify({ [seedKey || path.replace('/', '')]: items }) : undefined
    }),
});

/**
 * Layer 3: Consolidated API Implementation
 * Exposes a single 'api' key with partitioned resources.
 */
export const api = {
    products: {
        ...createResource<any>('/products', 'products'),
        bulkUpdate: (products: any[]) =>
            request<any[]>('/products/bulk/update', { method: 'PUT', body: JSON.stringify({ products }) }),
    },

    customers: createResource<any>('/customers', 'customers'),

    vendors: createResource<any>('/vendors', 'vendors'),

    transactions: {
        ...createResource<any>('/transactions'),
        getBySource: (source: 'online' | 'offline') =>
            request<any[]>(`/transactions/source/${source}`),
    },

    purchases: {
        getAll: () => request<any[]>('/purchases'),
        create: (data: any) => request<any>('/purchases', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) => request<any>(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request<any>(`/purchases/${id}`, { method: 'DELETE' }),
    },

    users: {
        ...createResource<any>('/users', 'users'),
        login: (email: string, password: string) =>
            request<any>('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    },

    whatsapp: {
        getStatus: () => request<any>('/whatsapp/status'),
        getQr: () => request<any>('/whatsapp/qr'),
        send: (data: any) => request<any>('/whatsapp/send', { method: 'POST', body: JSON.stringify(data) }),
        sendReceipt: (to: string, receipt: any) =>
            request<any>('/whatsapp/send-receipt', { method: 'POST', body: JSON.stringify({ to, receipt }) }),
        sendBulk: (messages: any[]) =>
            request<any>('/whatsapp/send-bulk', { method: 'POST', body: JSON.stringify({ messages }) }),
        getMessages: (params?: any) => {
            const query = new URLSearchParams(params as any);
            return request<any>(`/whatsapp/messages?${query.toString()}`);
        },
        requestPairingCode: (phoneNumber: string) =>
            request<any>('/whatsapp/pair', { method: 'POST', body: JSON.stringify({ phoneNumber }) }),
        logout: () => request<any>('/whatsapp/logout', { method: 'POST' }),
        restart: () => request<any>('/whatsapp/restart', { method: 'POST' }),
    },

    auth: {
        sendOtp: (phone: string) =>
            request<any>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
        verifyOtp: (phone: string, otp: string) =>
            request<any>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
        checkSession: (token: string) =>
            request<any>('/auth/session', { headers: { 'X-Session-Token': token } }),
        logout: (token: string) =>
            request<any>('/auth/logout', { method: 'POST', headers: { 'X-Session-Token': token } }),
        getProfile: (token: string) =>
            request<any>('/auth/profile', { headers: { 'X-Session-Token': token } }),
        updateProfile: (token: string, data: any) =>
            request<any>('/auth/profile', { method: 'PUT', headers: { 'X-Session-Token': token }, body: JSON.stringify(data) }),
        addAddress: (token: string, address: any) =>
            request<any>('/auth/addresses', { method: 'POST', headers: { 'X-Session-Token': token }, body: JSON.stringify(address) }),
        updateAddress: (token: string, addrId: string, address: any) =>
            request<any>(`/auth/addresses/${addrId}`, { method: 'PUT', headers: { 'X-Session-Token': token }, body: JSON.stringify(address) }),
        deleteAddress: (token: string, addrId: string) =>
            request<any>(`/auth/addresses/${addrId}`, { method: 'DELETE', headers: { 'X-Session-Token': token } }),
        getOrders: (token: string) =>
            request<any>('/auth/orders', { headers: { 'X-Session-Token': token } }),
        getStoreCustomers: () =>
            request<any>('/auth/store-customers'),
        getWishlist: (token: string) =>
            request<any>('/auth/wishlist', { headers: { 'X-Session-Token': token } }),
        addToWishlist: (token: string, productId: string) =>
            request<any>('/auth/wishlist', { method: 'POST', headers: { 'X-Session-Token': token }, body: JSON.stringify({ productId }) }),
        removeFromWishlist: (token: string, productId: string) =>
            request<any>(`/auth/wishlist/${productId}`, { method: 'DELETE', headers: { 'X-Session-Token': token } }),
        signup: (phone: string, name: string, password: string) =>
            request<any>('/auth/signup', { method: 'POST', body: JSON.stringify({ phone, name, password }) }),
        loginWithPassword: (phone: string, password: string) =>
            request<any>('/auth/login-password', { method: 'POST', body: JSON.stringify({ phone, password }) }),
        setPassword: (token: string, password: string) =>
            request<any>('/auth/set-password', { method: 'POST', headers: { 'X-Session-Token': token }, body: JSON.stringify({ password }) }),
    },

    invoices: {
        generate: async (transactionId: string, format: 'a4' | 'thermal' = 'a4', shopSettings?: any) => {
            const res = await fetch(`${API_BASE}/invoices/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId, format, shopSettings }),
            });
            if (!res.ok) throw new Error('PDF generation failed');
            return res.blob();
        },
        generateDirect: async (bill: any, shopSettings?: any, format: 'a4' | 'thermal' = 'a4') => {
            const res = await fetch(`${API_BASE}/invoices/generate-direct`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bill, shopSettings, format }),
            });
            if (!res.ok) throw new Error('PDF generation failed');
            return res.blob();
        },
        sendWhatsApp: (bill: any, shopSettings?: any, format: 'a4' | 'thermal' = 'a4') =>
            request<any>('/invoices/send-whatsapp', { method: 'POST', body: JSON.stringify({ bill, shopSettings, format }) }),
        sendBulkMessage: (customers: any[], messageTemplate: string) =>
            request<any>('/invoices/send-bulk-message', { method: 'POST', body: JSON.stringify({ customers, messageTemplate }) }),
    }
};

