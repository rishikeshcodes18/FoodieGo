import express from 'express';
import { db } from '../db.js';
import { syncLiveReview } from '../firebase.js';

const router = express.Router();

// POST /api/reviews - Submit review and rating for an order
router.post('/', async (req, res) => {
  try {
    const { customerId = 'P001', restaurantId, orderId, rating, commentText } = req.body;

    if (!restaurantId || !orderId || !rating) {
      return res.status(400).json({ success: false, message: 'Restaurant, Order ID, and rating are required' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1.0 and 5.0' });
    }

    // Check if review already exists for this order
    const existing = db.prepare('SELECT Review_ID FROM REVIEW WHERE Order_ID = ?').get(orderId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A review has already been submitted for this order.' });
    }

    const reviewId = `REV${Date.now().toString().slice(-6)}`;
    db.prepare(`
      INSERT INTO REVIEW (Review_ID, Customer_ID, Restaurant_ID, Order_ID, Rating, Comment_Text, Review_Date)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(reviewId, customerId, restaurantId, orderId, numRating, commentText || '');

    // Get updated derived rating
    const updatedStats = db.prepare(`
      SELECT 
        ROUND(AVG(Rating), 1) as new_rating,
        COUNT(Review_ID) as total_reviews
      FROM REVIEW
      WHERE Restaurant_ID = ?
    `).get(restaurantId);

    // Fetch customer reviewer name for nice display in Firebase
    const customer = db.prepare('SELECT First_Name, Last_Name FROM PERSON WHERE Person_ID = ?').get(customerId);
    const reviewerName = customer ? `${customer.First_Name} ${customer.Last_Name}` : 'Customer';

    // Dual-write review to Firebase Realtime Database
    try {
      await syncLiveReview(reviewId, {
        reviewId,
        customerId,
        reviewerName,
        restaurantId,
        orderId,
        rating: numRating,
        commentText: commentText || '',
        newRating: updatedStats.new_rating,
        totalReviews: updatedStats.total_reviews
      });
    } catch (fbErr) {
      console.warn('[Firebase] Review sync note:', fbErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been recorded.',
      data: {
        reviewId,
        newRating: updatedStats.new_rating,
        totalReviews: updatedStats.total_reviews
      }
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reviews/restaurant/:id - Fetch reviews for a restaurant
router.get('/restaurant/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reviews = db.prepare(`
      SELECT 
        rev.Review_ID,
        rev.Rating,
        rev.Comment_Text,
        rev.Review_Date,
        p.First_Name || ' ' || SUBSTR(p.Last_Name, 1, 1) || '.' AS Reviewer_Name
      FROM REVIEW rev
      JOIN PERSON p ON rev.Customer_ID = p.Person_ID
      WHERE rev.Restaurant_ID = ?
      ORDER BY rev.Review_Date DESC
    `).all(id);

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
