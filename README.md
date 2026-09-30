# 🏢 Property Hub & BachelorHub RESTful API Backend

Production-ready Node.js + Express + Mongoose backend engine for the **Property Hub Admin Panel** and **BachelorHub / OwnerHub Mobile Applications**.

---

## 📁 Project Architecture & Folder Structure

```
Property backend/
├── .env                  # Environment secrets & connection variables
├── .env.example          # Environment template
├── .gitignore            # Git exclusion rules
├── package.json          # Dependencies & npm scripts
├── src/
│   ├── app.js            # Express app instance, Helmet security, CORS, routes & errors
│   ├── server.js         # HTTP server entry point & MongoDB initialization
│   ├── config/
│   │   └── db.js         # Resilient Mongoose database connection
│   ├── models/           # Mongoose Data Schemas
│   │   ├── User.js       # Tenants, bachelors, roommates, roles
│   │   ├── Owner.js      # Landlords, KYC docs, trust verification badges
│   │   ├── Property.js   # Listing details, rent/buy, photos, moderation status
│   │   ├── Service.js    # 9 Bachelor services (Tiffin, Laundry, Maid, etc.)
│   │   ├── UsedItem.js   # Student marketplace inventory & dispute flags
│   │   ├── Transaction.js# Razorpay payments, subscriptions & refunds
│   │   ├── Ticket.js     # User grievances & support inquiries
│   │   └── ActivityLog.js# Administrative audit trail
│   ├── controllers/      # Business Logic & Request Handlers
│   │   ├── authController.js
│   │   ├── propertyController.js
│   │   ├── kycController.js
│   │   ├── userController.js
│   │   ├── financeController.js
│   │   ├── serviceController.js
│   │   ├── usedItemController.js
│   │   └── communicationController.js
│   ├── routes/           # RESTful Endpoints
│   │   ├── index.js      # Root router & /api/health check
│   │   ├── authRoutes.js
│   │   ├── propertyRoutes.js
│   │   ├── kycRoutes.js
│   │   ├── userRoutes.js
│   │   ├── financeRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── usedItemRoutes.js
│   │   └── communicationRoutes.js
│   ├── middleware/       # Security & Processing Middlewares
│   │   ├── authMiddleware.js   # JWT verification & RBAC roles
│   │   └── errorMiddleware.js  # Centralized error & 404 handler
│   ├── utils/
│   │   ├── apiResponse.js      # Unified JSON response helpers
│   │   └── generateToken.js    # JWT token generator
│   └── seed/
│       ├── mockSource.js       # Enterprise seed data
│       └── seedData.js         # One-click database seeder script
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
The `.env` file is already created with standard development defaults:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/property_hub_db
JWT_SECRET=property_hub_super_secret_jwt_key_2026_xyz
ADMIN_CLIENT_URL=http://localhost:5173
```

### 3. Start Development Server
```bash
npm run dev
```
Server runs on: **`http://localhost:5000`**

### 4. Seed Database (Optional)
```bash
npm run seed
```

---

## 📡 Core API Endpoints

| Resource | Method | Endpoint | Description |
|---|---|---|---|
| **Health Check** | `GET` | `/api/health` | Gateway status and sitemap |
| **Admin Login** | `POST` | `/api/auth/admin-login` | Master administrative auth |
| **Phone Login** | `POST` | `/api/auth/phone-login` | Tenant/Owner mobile OTP auth |
| **Properties** | `GET` | `/api/properties` | Catalog with filters & search |
| **Add Property** | `POST` | `/api/properties` | Publish verified listing |
| **Approve Listing** | `PATCH` | `/api/properties/:id/status` | Approve / Reject listing |
| **Boost Listing** | `PATCH` | `/api/properties/:id/featured` | Toggle Featured sponsorship |
| **Owner KYC** | `GET` | `/api/kyc/owners` | Owner queue & documents |
| **Approve KYC** | `PATCH` | `/api/kyc/:id/approve` | Grant verified trust badge |
| **Reject KYC** | `PATCH` | `/api/kyc/:id/reject` | Reject invalid documents |
| **User Directory** | `GET` | `/api/users` | All tenant & roommate records |
| **Suspend User** | `PATCH` | `/api/users/:id/toggle-block` | Lockout abusive account |
| **Finance Ledger** | `GET` | `/api/finance/transactions` | Razorpay transactions |
| **Process Refund** | `POST` | `/api/finance/refund` | Trigger Razorpay payout |
| **Push Broadcast** | `POST` | `/api/communication/broadcast-push` | Dispatch Firebase notifications |
| **Services** | `GET` | `/api/services` | 9 Bachelor service verticals |
| **Used Marketplace** | `GET` | `/api/used-items` | Furniture & appliance items |
