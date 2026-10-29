import React from 'react';
import { X, Clock, CheckCircle2, Star, RotateCcw, ChevronRight, User } from 'lucide-react';

export default function OrderHistoryModal({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  orders = [],
  loading,
  onTrackOrder,
  onOpenReview,
  onReorder
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '85vh', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Clock size={24} color="#fc5200" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e1e24' }}>
            My Past Orders & History
          </h2>
        </div>

        {!currentUser ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#686b78' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff2eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem', color: '#fc5200' }}>
              <User size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1e24', marginBottom: '0.4rem' }}>
              Sign in to view your orders
            </h3>
            <p style={{ fontSize: '0.88rem', marginBottom: '1.5rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
              Please sign in or create an account to view your past orders, active live tracking, and rate your deliveries.
            </p>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="btn-checkout"
              style={{ maxWidth: '220px', margin: '0 auto', justifyContent: 'center' }}
            >
              <span>Sign In / Register</span>
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#686b78' }}>
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#686b78' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>No orders placed yet!</p>
            <p style={{ fontSize: '0.88rem' }}>When you place an order, it will show up here for live tracking and reviews.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto', maxHeight: '60vh', paddingRight: '0.2rem' }}>
            {orders.map((ord) => {
              let dateStr = 'Recent';
              if (ord.Order_Date) {
                try {
                  const d = new Date(ord.Order_Date);
                  dateStr = isNaN(d.getTime()) ? String(ord.Order_Date) : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                } catch {
                  dateStr = String(ord.Order_Date);
                }
              }

              return (
                <div
                  key={ord.Order_ID}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1.2rem',
                    background: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e1e24' }}>
                        {ord.Restaurant_Name}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#686b78' }}>
                        {dateStr} • #{ord.Order_ID}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: ord.Order_Status === 'DELIVERED' ? '#ecfdf5' : '#fff2eb',
                      color: ord.Order_Status === 'DELIVERED' ? '#065f46' : '#fc5200'
                    }}>
                      {ord.Order_Status ? ord.Order_Status.replace(/_/g, ' ') : 'PLACED'}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: '0.8rem', paddingBottom: '0.8rem', borderBottom: '1px dashed #e2e8f0' }}>
                    {ord.items && ord.items.length > 0 ? (
                      ord.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span>{it.Quantity}x {it.Food_Name}</span>
                          <span>₹{(Number(it.Quantity || 1) * Number(it.Item_Price || 0)).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#686b78' }}>Order processed successfully</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', fontSize: '1rem', color: '#1e1e24' }}>
                      Total: ₹{Number(ord.Amount_Paid || 0).toFixed(2)}
                    </span>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { onClose(); onTrackOrder(ord.Order_ID); }}
                        style={{
                          background: '#f1f3f5',
                          color: '#1e1e24',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <span>Track</span>
                        <ChevronRight size={14} />
                      </button>

                      <button
                        onClick={() => { onClose(); onReorder(ord); }}
                        style={{
                          background: '#f8f9fa',
                          border: '1px solid #e2e8f0',
                          color: '#4b5563',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Reorder</span>
                      </button>

                      {ord.Order_Status === 'DELIVERED' && !ord.hasReviewed && (
                        <button
                          onClick={() => { onClose(); onOpenReview(ord); }}
                          style={{
                            background: '#fff2eb',
                            color: '#fc5200',
                            border: '1px solid rgba(252,82,0,0.3)',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Star size={13} fill="#fc5200" />
                          <span>Rate Order</span>
                        </button>
                      )}

                      {ord.hasReviewed && (
                        <span style={{ fontSize: '0.8rem', color: '#0f8a3c', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Star size={13} fill="#0f8a3c" />
                          <span>Rated {ord.Review_Rating}★</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
