import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';

import offersRouter from './routes/offers.js';
import restaurantsRouter from './routes/restaurants.js';
import couponsRouter from './routes/coupons.js';
import ordersRouter from './routes/orders.js';
import reviewsRouter from './routes/reviews.js';
import customersRouter from './routes/customers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database with 16 relations and seed data
initDatabase();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logger for visibility
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Root welcome & API sitemap
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FoodieGo API',
    endpoints: {
      health: '/api/health',
      offers: '/api/offers',
      restaurants: '/api/restaurants',
      coupons: '/api/coupons',
      orders: '/api/orders',
      customers: '/api/customers'
    }
  });
});

import { isFirebaseAvailable } from './firebase.js';

// Health check endpoints (both /api/health and /health)
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    service: 'FoodieGo API',
    database: 'SQLite (16 Relations in 3NF)',
    firebase: isFirebaseAvailable() ? 'Active (Realtime Database synced)' : 'Disabled',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// API Routes
app.use('/api/offers', offersRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/customers', customersRouter);

// Start listening on 0.0.0.0 so localhost, 127.0.0.1 and network IPs work
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FoodieGo API Server running on port ${PORT} (0.0.0.0)`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
