import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, MapPin, Phone, Bike, Play, Star, Radio } from 'lucide-react';
import { subscribeToLiveOrder } from '../firebase.js';

const STAGES = [
  { key: 'PLACED', label: 'Order Placed', desc: 'We have received your order' },
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Restaurant accepted your order' },
  { key: 'PREPARING', label: 'Kitchen Preparing', desc: 'Chefs are cooking fresh meals' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Delivery partner picked up package' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Food safely delivered. Enjoy!' }
];

export default function OrderTrackingModal({
  order,
  onClose,
  onAdvanceStatus,
  isAdvancing,
  onOpenReview
}) {
  if (!order) return null;

  const [liveStatus, setLiveStatus] = useState(order.Order_Status || 'PLACED');
  const [isFirebaseSynced, setIsFirebaseSynced] = useState(false);

  // Sync with prop if it updates via REST
  useEffect(() => {
    if (order?.Order_Status) {
      setLiveStatus(order.Order_Status);
    }
  }, [order?.Order_Status]);

  // Subscribe to real-time events from Firebase Realtime Database
  useEffect(() => {
    if (!order?.Order_ID) return;

    const unsubscribe = subscribeToLiveOrder(order.Order_ID, (data) => {
      if (data?.orderStatus) {
        setLiveStatus(data.orderStatus);
        setIsFirebaseSynced(true);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [order?.Order_ID]);

  const currentStatus = liveStatus;
  const currentIndex = STAGES.findIndex(s => s.key === currentStatus);
  const isDelivered = currentStatus === 'DELIVERED';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1400 }}>
      <div className="modal-content tracking-container" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
            <span className="tracking-status-badge" style={{ margin: 0 }}>
              LIVE TRACKING: {currentStatus.replace(/_/g, ' ')}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              background: isFirebaseSynced ? '#ecfdf5' : '#f8fafc',
              color: isFirebaseSynced ? '#059669' : '#64748b',
              border: `1px solid ${isFirebaseSynced ? '#a7f3d0' : '#e2e8f0'}`
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isFirebaseSynced ? '#10b981' : '#94a3b8',
                boxShadow: isFirebaseSynced ? '0 0 6px #10b981' : 'none'
              }} />
              {isFirebaseSynced ? 'Firebase Realtime Live' : 'Firebase Ready'}
            </span>
          </div>
          <h2 className="tracking-eta">
            {isDelivered ? 'Order Delivered!' : 'Arriving in ~25-30 mins'}
          </h2>
        </div>

        {/* 5-Stage Animated Delivery Stepper */}
        <div className="tracking-stepper">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={stage.key}
                className={`stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
              >
                <div className="stepper-dot">
                  {isCompleted ? <CheckCircle2 size={15} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1' }} />}
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: isCompleted ? '#1e1e24' : '#9ca3af' }}>
                    {stage.label}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: isCompleted ? '#686b78' : '#cbd5e1' }}>
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Driver Card (DELIVERY_PARTNER 3NF Subtype) */}
        <div className="driver-card">
          <div className="driver-info">
            <div className="driver-avatar">
              <Bike size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fc5200', textTransform: 'uppercase' }}>
                Delivery Partner (3NF)
              </span>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1e24' }}>
                {order.Partner_Name || 'Vikram Singh'}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#686b78' }}>
                {order.Vehicle_Type || 'BIKE'} • {order.License_Number || 'KA-01-AB-1234'}
              </p>
            </div>
          </div>

          <a
            href={`tel:${order.Partner_Phone || '9740112233'}`}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f8a3c',
              boxShadow: '0 2px 8px rgba(15, 138, 60, 0.2)'
            }}
            title="Call Partner"
          >
            <Phone size={18} />
          </a>
        </div>

        {/* Demo Simulation Controls */}
        <div style={{ background: '#fff2eb', border: '1px solid rgba(252,82,0,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: '0.88rem', color: '#fc5200', display: 'block' }}>Pipeline Demo Simulation</strong>
            <span style={{ fontSize: '0.78rem', color: '#686b78' }}>Advance order delivery lifecycle in database</span>
          </div>

          <button
            onClick={() => onAdvanceStatus(order.Order_ID)}
            disabled={isAdvancing || isDelivered}
            style={{
              background: isDelivered ? '#9ca3af' : '#fc5200',
              color: '#ffffff',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: isDelivered ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={14} />
            <span>{isDelivered ? 'Delivered' : isAdvancing ? 'Advancing...' : 'Advance Stage'}</span>
          </button>
        </div>

        {/* If delivered: Rate & Review button */}
        {isDelivered && (
          <button
            onClick={() => { onClose(); onOpenReview(order); }}
            style={{
              width: '100%',
              background: '#0f8a3c',
              color: '#ffffff',
              padding: '0.85rem',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              boxShadow: '0 4px 14px rgba(15, 138, 60, 0.3)'
            }}
          >
            <Star size={18} fill="#ffffff" />
            <span>Rate & Review Food / Restaurant</span>
          </button>
        )}

        {/* Order Details summary */}
        <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '1rem', fontSize: '0.85rem', color: '#686b78' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>Order ID:</span>
            <strong style={{ color: '#1e1e24' }}>{order.Order_ID}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>Delivering To:</span>
            <strong style={{ color: '#1e1e24' }}>{order.Delivery_Address}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Amount Paid:</span>
            <strong style={{ color: '#0f8a3c' }}>₹{Number(order.Amount_Paid || 0).toFixed(2)} ({order.Payment_Method})</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
