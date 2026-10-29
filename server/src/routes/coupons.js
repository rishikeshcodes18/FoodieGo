import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/coupons - List all active coupons
router.get('/', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const coupons = db.prepare(`
      SELECT Coupon_ID, Code, Discount_Percentage, Min_Order_Amount, Max_Discount_Amount, Expiry_Date
      FROM COUPON
      WHERE Is_Active = 1 AND Expiry_Date >= ?
      ORDER BY Discount_Percentage DESC
    `).all(today);

    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/coupons/validate - Validate coupon against cart subtotal
router.post('/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const coupon = db.prepare(`
      SELECT * FROM COUPON 
      WHERE UPPER(Code) = UPPER(?) AND Is_Active = 1 AND Expiry_Date >= ?
    `).get(code.trim(), today);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const cartAmount = Number(subtotal) || 0;
    if (cartAmount < coupon.Min_Order_Amount) {
      return res.status(400).json({
        success: false,
        message: `Coupon '${coupon.Code}' requires a minimum order value of ₹${coupon.Min_Order_Amount}. Add ₹${coupon.Min_Order_Amount - cartAmount} more!`
      });
    }

    const rawDiscount = cartAmount * (coupon.Discount_Percentage / 100);
    const discountAmount = Math.min(rawDiscount, coupon.Max_Discount_Amount);

    res.json({
      success: true,
      message: `Coupon '${coupon.Code}' applied successfully! You saved ₹${discountAmount.toFixed(2)}`,
      data: {
        couponId: coupon.Coupon_ID,
        code: coupon.Code,
        discountPercentage: coupon.Discount_Percentage,
        discountAmount: Number(discountAmount.toFixed(2)),
        finalSubtotal: Number((cartAmount - discountAmount).toFixed(2))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
