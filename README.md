# FoodieGo — Online Food Delivery System (OFDS)

Full-stack DBMS project featuring a relational database, an Express REST API backend, an automated CI/CD pipeline, and a modern customer frontend matching the FoodieGo / Swiggy design system.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────┐
│             Frontend (Client - React + Vite)           │
│  - Hero Banner with Dynamic Top Offers (60% / 50%)     │
│  - 14-Dish Craving Carousel with Live Filtering        │
│  - Restaurant Menu & Ingredient Inspector              │
│  - Slide-Over Cart Drawer & Coupon Validation Engine   │
│  - 5-Stage Live Delivery Tracker (Firebase Realtime)   │
└──────────────┬───────────────────────────▲─────────────┘
               │ REST API (/api)           │ Realtime Listener
┌──────────────▼───────────────────────────┴─────────────┐
│             Backend API (Node.js + Express)            │
│  - 16 Relational Tables                                │
│  - Embedded SQLite Engine + Oracle SQL DDL & Seed      │
│  - Dual-Write Realtime Engine (Firebase Admin SDK)     │
│  - Derived Views (Ratings, Totals, Ages)               │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
┌──────────────▼─────────────┐ ┌───────────▼─────────────┐
│    SQLite RDBMS (/db)      │ │   Firebase Cloud RTDB   │
│ - 16 Tables                │ │ - Live Order Tracking   │
│ - 4 Views + Triggers       │ │ - Realtime Event Sync   │
└────────────────────────────┘ └─────────────────────────┘
```

---

## 2. CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

The automated pipeline triggers on push/PR:
1. **Schema Validation**: Validates the Oracle SQL DDL (`db/schema.sql`) and Seed scripts (`db/seed_data.sql`).
2. **Backend Smoke Tests**: Executes `node server/tests/api.test.js` validating all endpoints (health, offers, menus, ingredients, orders, coupons, reviews).
3. **Frontend Production Build**: Runs `pnpm run build` in `/client` to verify bundle compilation and tree-shaking.

---

## 3. How to Run Locally

### Start Backend Server:
```bash
node server/src/index.js
# Server runs on http://localhost:5000
```

### Start Frontend Client:
```bash
pnpm --dir client dev
# Vite runs on http://localhost:3000
```

### Run Automated API Test Suite:
```bash
node server/tests/api.test.js
```
