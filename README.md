# NEXA POS & Inventory Management System

NEXA POS is a modern, full-stack Point of Sale (POS) and Inventory Management System designed for retail businesses. It features a comprehensive admin dashboard for managing inventory, customers, vendors, and transactions, alongside a customer-facing storefront. It also integrates seamlessly with the WhatsApp Business API for automated receipts and notifications.

## 🌟 Key Features

### Admin Dashboard (`/admin`)
*   **Inventory Management**: Full CRUD operations for products, bulk updates, stock tracking, and low-stock alerts.
*   **Billing & POS System**: Split payments (Cash, UPI, Card), discount application, and GST calculation.
*   **Transaction History**: Generate PDF invoices and send them directly to customers via WhatsApp.
*   **Customer & Vendor Ledger**: Track outstanding balances, total spending, and transaction histories.
*   **WhatsApp Integration**: Pair your WhatsApp account via QR code to send automated order confirmations, payment receipts, and promotional messages.

### Customer Storefront (`/`)
*   **Product Catalog**: Browse available products with real-time stock status.
*   **Shopping Cart & Checkout**: Add items to cart and place orders online (which immediately syncs with the POS).
*   **User Profiles**: Customers can log in, view order history, and manage wishlists.

## 🛠 Tech Stack

### Frontend
*   **Framework**: React 18+ (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Routing**: Custom state-based routing protected by authentication context.

### Backend
*   **Framework**: Node.js & Express.js
*   **Language**: TypeScript
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Authentication**: JWT (JSON Web Tokens) with short-lived access and long-lived refresh tokens.
*   **External API**: WhatsApp Business RPC Microservice

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   PostgreSQL running locally or remotely

### 1. Database Setup
Ensure PostgreSQL is running. Create a new database for the project (e.g., `nexapos`).

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd apps/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexapos?schema=public"
   ```
5. Run Prisma migrations to set up the database schema:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Seed the database with initial admin users and sample data:
   ```bash
   npx prisma db seed
   ```
7. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5001`.*

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd apps/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000` or `http://localhost:5173`.*

## 🔐 Default Credentials

After running the database seed, you can log in to the admin dashboard at `http://localhost:3000/login` with the following default accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `surya@nexarats.com` | `admin123` |
| **Manager** | `saisurya7989@gmail.com` | `admin123` |

## 📱 WhatsApp Integration

The application uses an external microservice to handle WhatsApp connectivity. 
1. Log in to the Admin Dashboard.
2. Navigate to **Settings > WhatsApp**.
3. Wait for the QR code to generate.
4. Scan the QR code using your WhatsApp app (`Settings > Linked Devices > Link a Device`).
5. Once connected, toggle your desired automated message settings (Auto-Reply, Order Confirmations, Receipts).

*Note: The backend dynamically generates distinct session IDs on every boot to prevent session lockouts.*

## 📁 Project Structure

```
NEXA POS/
├── apps/
│   ├── frontend/          # React SPA
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── context/    # Global state management AppContext
│   │   │   ├── pages/      # Route-level components (Admin, Storefront, Settings)
│   │   │   ├── services/   # API client (api.ts)
│   │   │   └── types/      # TypeScript interfaces
│   │   └── ...
│   ├── backend/           # Node.js Express API
│   │   ├── prisma/        # Database schema and seed scripts
│   │   ├── src/
│   │   │   ├── config/     # Environment configurations
│   │   │   ├── middleware/ # Auth, Validation, Error Handling
│   │   │   ├── modules/    # Feature-based modules (Products, Auth, WhatsApp)
│   │   │   │               # Each contains .router.ts, .service.ts, .schema.ts
│   │   │   └── utils/      # Helpers (query parsers, error classes)
│   │   └── ...
└── README.md
```

## 📝 License
Proprietary / Closed Source. All rights reserved. NEXA POS.
