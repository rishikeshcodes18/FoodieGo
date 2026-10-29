import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/offers - Dynamic top active discounts for Food Delivery and Dineout
router.get('/', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    
    // Query max discount for general/delivery coupons
    const topDelivery = db.prepare(`
      SELECT MAX(Discount_Percentage) as max_pct
      FROM COUPON
      WHERE Is_Active = 1 AND Expiry_Date >= ? AND Code != 'DINEOUT50'
    `).get(today);

    // Query dineout specific discount
    const topDineout = db.prepare(`
      SELECT MAX(Discount_Percentage) as max_pct
      FROM COUPON
      WHERE Is_Active = 1 AND Expiry_Date >= ? AND (Code LIKE '%DINEOUT%' OR Code = 'DINEOUT50')
    `).get(today);

    // Fallback or overall active coupons
    const deliveryDiscount = topDelivery?.max_pct ? Math.round(topDelivery.max_pct) : null;
    const dineoutDiscount = topDineout?.max_pct ? Math.round(topDineout.max_pct) : null;

    res.json({
      success: true,
      data: {
        deliveryDiscount, // e.g. 60 or null if none
        dineoutDiscount   // e.g. 50 or null if none
      }
    });
  } catch (err) {
    console.error('Error fetching offers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
