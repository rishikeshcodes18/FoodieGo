import React, { useState } from 'react';
import { X, Star, Sparkles } from 'lucide-react';

export default function ReviewModal({ order, onClose, onSubmitReview, isSubmitting }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReview({
      orderId: order.Order_ID,
      restaurantId: order.Restaurant_ID,
      rating,
      commentText: comment
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1500 }}>
      <div className="modal-content" style={{ maxWidth: '480px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fc5200', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            DBMS Derived Attribute: VW_RESTAURANT_RATINGS
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e1e24', marginTop: '0.4rem' }}>
            Rate Your Meal
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#686b78', marginTop: '0.2rem' }}>
            How was your food from <strong>{order.Restaurant_Name}</strong>?
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating Picker */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                style={{
                  color: (hoverRating || rating) >= star ? '#f59e0b' : '#d1d5db',
                  transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s'
                }}
              >
                <Star size={34} fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'} />
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
              Your Review & Comments
            </label>
            <textarea
              rows="3"
              placeholder="Tell others what you loved about the food, packaging, or delivery..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-checkout"
            style={{ justifyContent: 'center', gap: '0.5rem' }}
          >
            <span>{isSubmitting ? 'Submitting Review...' : 'Submit Rating & Review'}</span>
            <Sparkles size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
