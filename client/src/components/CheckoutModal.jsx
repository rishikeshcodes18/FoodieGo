import React, { useState } from 'react';
import { X, MapPin, CreditCard, Smartphone, Banknote, Plus, ShieldCheck, Check } from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  cartRestaurant,
  appliedCoupon,
  specialInstructions,
  addresses,
  onAddNewAddress,
  onPlaceOrder,
  isPlacing
}) {
  const defaultAddr = addresses?.find(a => a.Is_Default === 1 || a.isDefault === 1) || addresses?.[0];
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddr?.Address_ID || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState(defaultAddr?.City || 'Chennai');
  const [newPincode, setNewPincode] = useState(defaultAddr?.Postal_Code || '600001');
  const [newAddrType, setNewAddrType] = useState('HOME');

  React.useEffect(() => {
    if (addresses && addresses.length > 0) {
      const active = addresses.find(a => a.Is_Default === 1 || a.isDefault === 1) || addresses[0];
      if (active) {
        setSelectedAddressId(active.Address_ID);
        if (active.City) setNewCity(active.City);
        if (active.Postal_Code) setNewPincode(active.Postal_Code);
      }
    }
  }, [addresses]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const deliveryFee = subtotal > 500 ? 0 : 40.0;
  const taxAmount = Number((subtotal * 0.05).toFixed(2));
  const finalTotal = Math.max(0, Number((subtotal - discountAmount + deliveryFee + taxAmount).toFixed(2)));

  const handleCreateAddress = (e) => {
    e.preventDefault();
    if (!newStreet || !newCity || !newPincode) return;
    onAddNewAddress({
      street: newStreet,
      city: newCity,
      postalCode: newPincode,
      addressType: newAddrType
    });
    setShowAddAddr(false);
    setNewStreet('');
  };

  const handleCheckout = () => {
    onPlaceOrder({
      addressId: selectedAddressId,
      paymentMethod,
      specialInstructions
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1300 }}>
      <div className="modal-content" style={{ maxWidth: '580px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <h2 className="checkout-title">Checkout & Payment</h2>

        {/* 1. Delivery Address (3NF ADDRESS relation) */}
        <div style={{ marginBottom: '1.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1e24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={18} color="#fc5200" />
              <span>Select Delivery Address</span>
            </h4>
            <button
              style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fc5200', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              onClick={() => setShowAddAddr(!showAddAddr)}
            >
              <Plus size={14} />
              <span>Add New</span>
            </button>
          </div>

          {showAddAddr && (
            <form onSubmit={handleCreateAddress} style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
              <input
                type="text"
                placeholder="Street / Flat / House No."
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="City"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  required
                  style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  required
                  style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <button
                type="submit"
                style={{ background: '#1e1e24', color: '#ffffff', padding: '0.45rem 1rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem' }}
              >
                Save Address
              </button>
            </form>
          )}

          <div className="address-cards-grid">
            {addresses.map((addr) => (
              <div
                key={addr.Address_ID}
                className={`address-card ${selectedAddressId === addr.Address_ID ? 'selected' : ''}`}
                onClick={() => setSelectedAddressId(addr.Address_ID)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#1e1e24' }}>
                    {addr.Address_Type || 'HOME'}
                  </span>
                  {selectedAddressId === addr.Address_ID && (
                    <span style={{ background: '#fc5200', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#686b78' }}>
                  {addr.Street}, {addr.City} - {addr.Postal_Code}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Payment Method (PAYMENT 3NF relation) */}
        <div style={{ marginBottom: '1.8rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1e24', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={18} color="#0f8a3c" />
            <span>Select Payment Method</span>
          </h4>

          <div className="payment-methods-grid">
            <div
              className={`payment-method-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('UPI')}
            >
              <Smartphone size={20} />
              <span>UPI / QR Pay</span>
            </div>

            <div
              className={`payment-method-card ${paymentMethod === 'CREDIT_CARD' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('CREDIT_CARD')}
            >
              <CreditCard size={20} />
              <span>Credit / Debit Card</span>
            </div>

            <div
              className={`payment-method-card ${paymentMethod === 'CASH_ON_DELIVERY' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
            >
              <Banknote size={20} />
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Total & Pay Button */}
        <div style={{ background: '#f8f9fa', padding: '1.2rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', color: '#686b78', display: 'block' }}>Total Amount to Pay</span>
            <strong style={{ fontSize: '1.4rem', color: '#1e1e24', fontFamily: 'var(--font-display)' }}>₹{finalTotal.toFixed(2)}</strong>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#0f8a3c', fontWeight: '700', background: '#ecfdf5', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
            Instant Order Confirmation
          </span>
        </div>

        <button
          className="btn-checkout"
          disabled={isPlacing}
          onClick={handleCheckout}
          style={{ opacity: isPlacing ? 0.7 : 1, cursor: isPlacing ? 'not-allowed' : 'pointer' }}
        >
          <span>{isPlacing ? 'Processing Order...' : `Pay ₹${finalTotal.toFixed(2)} & Place Order`}</span>
          <ShieldCheck size={20} />
        </button>
      </div>
    </div>
  );
}
