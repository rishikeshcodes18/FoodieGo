import React, { useState } from 'react';
import { X, Plus, Minus, Tag, ArrowRight, ShoppingBag, CheckCircle } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  cartRestaurant,
  onUpdateQuantity,
  couponCode,
  appliedCoupon,
  couponError,
  onApplyCoupon,
  onRemoveCoupon,
  specialInstructions,
  onUpdateInstructions,
  onProceedToCheckout
}) {
  const [inputCode, setInputCode] = useState('');

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const deliveryFee = subtotal > 500 ? 0 : 40.0;
  const taxAmount = Number((subtotal * 0.05).toFixed(2));
  const finalTotal = Math.max(0, Number((subtotal - discountAmount + deliveryFee + taxAmount).toFixed(2)));

  const handleApply = (codeToApply) => {
    const code = codeToApply || inputCode;
    if (code.trim()) {
      onApplyCoupon(code.trim());
      setInputCode('');
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={22} color="#fc5200" />
            <h2 className="cart-drawer-title">Your Order Cart</h2>
          </div>
          <button className="modal-close-btn" style={{ position: 'static' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#686b78' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff2eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem', color: '#fc5200' }}>
                <ShoppingBag size={38} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1e24', marginBottom: '0.4rem' }}>Your Cart is Empty</h3>
              <p style={{ fontSize: '0.9rem' }}>Explore our best food options and satisfy your cravings!</p>
            </div>
          ) : (
            <>
              {/* Restaurant info */}
              {cartRestaurant && (
                <div className="cart-restaurant-banner">
                  <img
                    src={cartRestaurant.Image_URL}
                    alt={cartRestaurant.Name}
                    style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                  />
                  <div>
                    <h4 className="cart-restaurant-name">{cartRestaurant.Name}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#686b78' }}>{cartRestaurant.City}</p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="cart-items-list">
                {cart.map((it) => (
                  <div key={it.foodId} className="cart-item-row">
                    <div className="cart-item-info">
                      {it.isVeg ? (
                        <div className="veg-indicator" style={{ marginBottom: 0 }}>
                          <div className="veg-indicator-dot"></div>
                        </div>
                      ) : (
                        <div className="nonveg-indicator" style={{ marginBottom: 0 }}>
                          <div className="nonveg-indicator-triangle"></div>
                        </div>
                      )}
                      <span>{it.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="cart-stepper">
                        <button onClick={() => onUpdateQuantity(it.foodId, it.quantity - 1)}>
                          <Minus size={12} />
                        </button>
                        <span>{it.quantity}</span>
                        <button onClick={() => onUpdateQuantity(it.foodId, it.quantity + 1)}>
                          <Plus size={12} />
                        </button>
                      </div>

                      <span style={{ fontWeight: '700', fontSize: '0.92rem', minWidth: '60px', textAlign: 'right' }}>
                        ₹{(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Instructions */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#686b78', marginBottom: '0.4rem' }}>
                  Cooking / Delivery Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave at door, extra spicy..."
                  value={specialInstructions}
                  onChange={(e) => onUpdateInstructions(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    outline: 'none',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Coupon Section */}
              <div className="coupon-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', fontWeight: '700', fontSize: '0.88rem' }}>
                  <Tag size={15} color="#fc5200" />
                  <span>Apply Coupon / Promo</span>
                </div>

                {appliedCoupon ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={16} color="#0f8a3c" />
                      <span style={{ fontWeight: '800', color: '#065f46', fontSize: '0.88rem' }}>
                        {appliedCoupon.code} Applied (Saved ₹{appliedCoupon.discountAmount})
                      </span>
                    </div>
                    <button
                      onClick={onRemoveCoupon}
                      style={{ fontSize: '0.78rem', fontWeight: '800', color: '#e43b4f' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="coupon-input-row">
                      <input
                        type="text"
                        placeholder="ENTER COUPON"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                      />
                      <button className="btn-apply-coupon" onClick={() => handleApply()}>
                        Apply
                      </button>
                    </div>

                    <div className="coupon-chips">
                      <span className="coupon-chip" onClick={() => handleApply('SUPER60')}>
                        SUPER60 (60% OFF)
                      </span>
                      <span className="coupon-chip" onClick={() => handleApply('WELCOME50')}>
                        WELCOME50 (50% OFF)
                      </span>
                      <span className="coupon-chip" onClick={() => handleApply('FOODIE20')}>
                        FOODIE20 (20% OFF)
                      </span>
                    </div>

                    {couponError && (
                      <p style={{ color: '#e43b4f', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '600' }}>
                        {couponError}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Bill Details */}
              <div className="bill-summary-card">
                <h4 className="bill-title">Bill Details</h4>
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="bill-row discount">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>- ₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong style={{ color: '#0f8a3c' }}>FREE</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>

                <div className="bill-row">
                  <span>Govt Taxes & GST (5%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>

                <div className="bill-divider" />

                <div className="bill-total-row">
                  <span>TO PAY</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <button className="btn-checkout" onClick={onProceedToCheckout}>
              <span>Proceed to Checkout</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>₹{finalTotal.toFixed(2)}</span>
                <ArrowRight size={18} />
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
