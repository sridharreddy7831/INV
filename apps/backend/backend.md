# NexaRats Pro — Backend Documentation

## 1. System Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────────┐
│   React SPA     │────▶│  Express.js API (port 5001)                  │
│  (port 5173)    │     │                                              │
│                 │     │  ┌─────────┐  ┌───────────┐  ┌──────────┐   │
│  api.ts ────────┼────▶│  │  Routes  │──│  Services │──│  Prisma  │   │
│  (67 endpoints) │     │  └─────────┘  └───────────┘  └──────────┘   │
└─────────────────┘     │       │             │              │         │
                        │  ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   │
                        │  │Validate │   │ Auth MW │   │PostgreSQL│   │
                        │  │  (Zod)  │   │  (JWT)  │   │   DB     │   │
                        │  └─────────┘   └─────────┘   └─────────┘   │
                        │       │                                      │
                        │  ┌────▼──────────────┐                      │
                        │  │ WhatsApp Service   │──▶ External API     │
                        │  └───────────────────┘                      │
                        └──────────────────────────────────────────────┘
```

**Architecture Pattern:** Controller → Service → Repository → Database

- **Controllers (Routers):** Handle HTTP requests, validate input, format responses
- **Services:** Business logic, data transformations, external API calls
- **Repository (Prisma):** Database queries via type-safe ORM
- **Middleware:** Auth guards, validation, error handling, logging

---

## 2. Folder Structure

```
apps/backend/
├── prisma/
│   ├── schema.prisma          # Database schema (14 models, 11 enums)
│   └── seed.ts                # Database seed script
├── migrations/
│   └── 001_initial.sql        # Raw SQL migration
├── src/
│   ├── server.ts              # Entry point — bootstrap + graceful shutdown
│   ├── app.ts                 # Express app assembly — routes, middleware
│   ├── config/
│   │   └── index.ts           # Environment config loader
│   ├── database/
│   │   └── prisma.ts          # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.ts            # JWT + Session auth guards, RBAC
│   │   ├── errorHandler.ts    # Global error handler
│   │   └── validate.ts        # Zod validation middleware
│   ├── utils/
│   │   ├── errors.ts          # Custom error classes
│   │   ├── response.ts        # API response helpers
│   │   └── query.ts           # Pagination, filtering, search utilities
│   └── modules/
│       ├── common/
│       │   ├── crud.service.ts   # Generic CRUD service factory
│       │   └── crud.router.ts    # Generic CRUD router factory
│       ├── products/
│       │   ├── product.service.ts
│       │   ├── product.schema.ts
│       │   └── product.router.ts
│       ├── customers/
│       │   ├── customer.service.ts
│       │   └── customer.router.ts
│       ├── vendors/
│       │   ├── vendor.service.ts
│       │   └── vendor.router.ts
│       ├── transactions/
│       │   ├── transaction.service.ts
│       │   └── transaction.router.ts
│       ├── purchases/
│       │   ├── purchase.service.ts
│       │   └── purchase.router.ts
│       ├── users/
│       │   ├── user.service.ts
│       │   ├── user.schema.ts
│       │   └── user.router.ts
│       ├── auth/
│       │   ├── auth.service.ts
│       │   ├── auth.schema.ts
│       │   └── auth.router.ts
│       ├── whatsapp/
│       │   ├── whatsapp.service.ts
│       │   └── whatsapp.router.ts
│       └── invoices/
│           ├── invoice.service.ts
│           └── invoice.router.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── backend.md                 # This file
```

---

## 3. Database Schema Overview

### Entities (14 Models)

| Model | Table | Purpose | Relations |
|-------|-------|---------|-----------|
| User | `users` | Admin/staff accounts | → Transactions, AuditLogs |
| Session | `sessions` | Customer session tokens | Standalone |
| OtpRecord | `otp_records` | OTP verification codes | Standalone |
| Product | `products` | Inventory items | → TransactionItems, Wishlists |
| Customer | `customers` | Store customers | → Transactions, Addresses, Wishlists, Orders |
| Address | `addresses` | Customer delivery addresses | → Customer |
| Wishlist | `wishlists` | Customer product wishlists | → Customer, Product |
| Vendor | `vendors` | Suppliers | → Purchases |
| Transaction | `transactions` | Sales/bills | → Customer, User, TransactionItems |
| TransactionItem | `transaction_items` | Line items in transactions | → Transaction, Product |
| Purchase | `purchases` | Purchase orders to vendors | → Vendor |
| Order | `orders` | Online store orders | → Customer |
| AuditLog | `audit_logs` | Action audit trail | → User |

### Features

- **Soft Delete:** `deletedAt` field on all major entities
- **Timestamps:** `createdAt` / `updatedAt` on all entities
- **Financial Precision:** `DECIMAL(12,2)` for all money fields
- **Indexes:** On all foreign keys, search fields, and commonly filtered columns
- **Enums:** 11 PostgreSQL enums for type safety

---

## 4. How to Run Migrations

### Using Prisma (Recommended)

```bash
# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio
```

### Using Raw SQL

```bash
psql -U postgres -d nexarats -f migrations/001_initial.sql
```

---

## 5. Environment Setup

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 15+
- npm or yarn

### Quick Start

```bash
# 1. Navigate to backend
cd apps/backend

# 2. Install dependencies
npm install

# 3. Create .env from template
cp .env.example .env
# Edit .env with your database credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev --name init

# 6. Seed database
npm run prisma:seed

# 7. Start development server
npm run dev
```

The server starts at `http://localhost:5001/api`

---

## 6. API Endpoint List

All endpoints are prefixed with `/api`.

### Health Check
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | None |

### Products (7 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Optional | List all (paginated, filterable) |
| GET | `/api/products/:id` | Optional | Get single product |
| POST | `/api/products` | Bearer | Create product |
| PUT | `/api/products/:id` | Bearer | Update product |
| DELETE | `/api/products/:id` | Bearer | Soft-delete product |
| POST | `/api/products/seed` | Bearer | Seed products |
| PUT | `/api/products/bulk/update` | Bearer | Bulk update products |

### Customers (6 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/customers` | Bearer | List all |
| GET | `/api/customers/:id` | Bearer | Get single |
| POST | `/api/customers` | Bearer | Create |
| PUT | `/api/customers/:id` | Bearer | Update |
| DELETE | `/api/customers/:id` | Bearer | Soft-delete |
| POST | `/api/customers/seed` | Bearer | Seed |

### Vendors (6 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/vendors` | Bearer | List all |
| GET | `/api/vendors/:id` | Bearer | Get single |
| POST | `/api/vendors` | Bearer | Create |
| PUT | `/api/vendors/:id` | Bearer | Update |
| DELETE | `/api/vendors/:id` | Bearer | Soft-delete |
| POST | `/api/vendors/seed` | Bearer | Seed |

### Transactions (7 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/transactions` | Bearer | List all |
| GET | `/api/transactions/:id` | Bearer | Get single with items |
| POST | `/api/transactions` | Bearer | Create with line items |
| PUT | `/api/transactions/:id` | Bearer | Update |
| DELETE | `/api/transactions/:id` | Bearer | Soft-delete |
| POST | `/api/transactions/seed` | Bearer | Seed |
| GET | `/api/transactions/source/:source` | Bearer | Filter by online/offline |

### Purchases (4 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/purchases` | Bearer | List all |
| POST | `/api/purchases` | Bearer | Create |
| PUT | `/api/purchases/:id` | Bearer | Update |
| DELETE | `/api/purchases/:id` | Bearer | Soft-delete |

### Users (7 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Bearer | List all (passwords stripped) |
| GET | `/api/users/:id` | Bearer | Get single |
| POST | `/api/users` | Bearer | Create (password hashed) |
| PUT | `/api/users/:id` | Bearer | Update |
| DELETE | `/api/users/:id` | Bearer | Soft-delete |
| POST | `/api/users/seed` | Bearer | Seed |
| POST | `/api/users/login` | None | Login → JWT token |

### Auth (17 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/send-otp` | None | Send OTP to phone |
| POST | `/api/auth/verify-otp` | None | Verify OTP → session token |
| POST | `/api/auth/signup` | None | Register with password |
| POST | `/api/auth/login-password` | None | Login with phone+password |
| GET | `/api/auth/session` | X-Session-Token | Validate session |
| POST | `/api/auth/logout` | X-Session-Token | End session |
| GET | `/api/auth/profile` | X-Session-Token | Get profile |
| PUT | `/api/auth/profile` | X-Session-Token | Update profile |
| POST | `/api/auth/set-password` | X-Session-Token | Set/change password |
| POST | `/api/auth/addresses` | X-Session-Token | Add address |
| PUT | `/api/auth/addresses/:addrId` | X-Session-Token | Update address |
| DELETE | `/api/auth/addresses/:addrId` | X-Session-Token | Delete address |
| GET | `/api/auth/orders` | X-Session-Token | Get customer orders |
| GET | `/api/auth/store-customers` | Bearer | List online store customers |
| GET | `/api/auth/wishlist` | X-Session-Token | Get wishlist |
| POST | `/api/auth/wishlist` | X-Session-Token | Add to wishlist |
| DELETE | `/api/auth/wishlist/:productId` | X-Session-Token | Remove from wishlist |

### WhatsApp (9 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/whatsapp/status` | Bearer | Connection status |
| GET | `/api/whatsapp/qr` | Bearer | Get QR code |
| POST | `/api/whatsapp/send` | Bearer | Send message |
| POST | `/api/whatsapp/send-receipt` | Bearer | Send receipt |
| POST | `/api/whatsapp/send-bulk` | Bearer | Send bulk messages |
| GET | `/api/whatsapp/messages` | Bearer | Get message history |
| POST | `/api/whatsapp/pair` | Bearer | Request pairing code |
| POST | `/api/whatsapp/logout` | Bearer | Disconnect WhatsApp |
| POST | `/api/whatsapp/restart` | Bearer | Restart service |

### Invoices (4 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/invoices/generate` | Bearer | Generate PDF from transaction |
| POST | `/api/invoices/generate-direct` | Bearer | Generate PDF from bill object |
| POST | `/api/invoices/send-whatsapp` | Bearer | Send invoice via WhatsApp |
| POST | `/api/invoices/send-bulk-message` | Bearer | Bulk promotional messages |

**Total: 68 endpoints** (67 frontend-mapped + 1 health check)

---

## 7. Authentication Flow

### Dual Authentication System

The backend supports **two separate auth mechanisms** to match the frontend:

#### A. JWT Bearer Auth (Admin Panel)
Used by admin/staff users accessing the dashboard.

```
1. POST /api/users/login  { email, password }
2. Server validates → returns JWT access + refresh tokens
3. Frontend stores token in sessionStorage
4. All subsequent requests include: Authorization: Bearer <token>
5. Middleware (authGuard) validates JWT on every request
```

#### B. Session Token Auth (Online Store)
Used by store customers via OTP or password login.

```
1. POST /api/auth/send-otp  { phone }  → OTP sent via WhatsApp/SMS
2. POST /api/auth/verify-otp  { phone, otp }  → Session token returned
   OR
   POST /api/auth/login-password  { phone, password }  → Session token
3. Frontend stores token in sessionStorage
4. All subsequent requests include: X-Session-Token: <token>
5. Middleware (sessionGuard) validates session in database
```

#### Password Hashing
- Algorithm: bcrypt with 12 salt rounds
- Passwords are never returned in API responses

#### Role-Based Access
- Roles: SUPER_ADMIN, ADMIN, MANAGER, CASHIER, STAFF, ACCOUNTANT, DELIVERY_AGENT
- Granular permissions stored as JSON in user record
- `requireRole()` middleware factory for route-level access control

---

## 8. WhatsApp Integration

### Architecture

```
Frontend  →  /api/whatsapp/*  →  WhatsApp Service  →  External API
                                 (retry + error handling)
                                 whatsapp.service.ts
```

### External Service
- **URL:** `https://whatsapp-services-liart.vercel.app`
- **Docs:** `https://whatsapp-services-liart.vercel.app/docs`

### Design Decisions

1. **Service Wrapper Pattern:** The external API is never called directly from controllers. All calls go through `whatsappService` which provides:
   - Retry logic (3 attempts with exponential backoff)
   - Consistent error handling (`ExternalServiceError`)
   - Environment-based configuration
   - Higher-level methods (`sendOTP`, `sendOrderNotification`, `sendTemplate`)

2. **Methods Available:**
   - `getStatus()` — Check connection
   - `getQr()` — QR for pairing
   - `sendMessage(data)` — Send single message
   - `sendReceipt(to, receipt)` — Send receipt
   - `sendBulk(messages)` — Batch send
   - `getMessages(params)` — Message history
   - `requestPairingCode(phone)` — Phone pairing
   - `logout()` — Disconnect
   - `restart()` — Restart service
   - `sendOTP(phone, otp)` — OTP via WhatsApp
   - `sendOrderNotification(phone, order)` — Order updates
   - `sendTemplate(phone, template, variables)` — Template messages

---

## 9. How to Extend Safely

### Adding a New Module

1. Create folder: `src/modules/<name>/`
2. Create service: `<name>.service.ts`
   - Use `createCrudService()` for standard CRUD
   - Add custom methods as needed
3. Create router: `<name>.router.ts`
   - Use `createCrudRouter()` for standard REST
   - Add custom routes
4. Create schema: `<name>.schema.ts` (Zod validation)
5. Register in `src/app.ts`:
   ```typescript
   import newRouter from './modules/<name>/<name>.router';
   app.use('/api/<name>', newRouter);
   ```

### Adding Database Fields

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_<field>`
3. Prisma client auto-regenerates
4. Update service/schema if needed

### Modifying External APIs

The WhatsApp service wrapper isolates external dependencies. To change the external API:

1. Update only `whatsapp.service.ts`
2. No changes needed in routers or controllers
3. Higher-level methods (sendOTP etc.) remain stable interfaces

### Design Patterns Used

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| Factory | `createCrudService()`, `createCrudRouter()` | Eliminate CRUD duplication |
| Wrapper | `whatsappService` | Isolate external dependencies |
| Middleware Chain | Auth → Validate → Handler → Error | Separation of concerns |
| Soft Delete | `deletedAt` field | Data preservation |
| DTO Stripping | Password removal in responses | Security |
| Upsert Seeding | `seed()` method | Idempotent data loading |

---

## 10. Response Format

All API responses follow a consistent structure:

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Error
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

---

## 11. Pagination & Filtering

All list endpoints support:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `limit` | 50 | Items per page (max 100) |
| `sortBy` | `createdAt` | Sort field |
| `sortOrder` | `desc` | `asc` or `desc` |
| `search` | — | Full-text search on `name` |
| `includeDeleted` | false | Include soft-deleted records |

Module-specific filters are passed as query params (e.g., `?category=Dairy&status=IN_STOCK`).
