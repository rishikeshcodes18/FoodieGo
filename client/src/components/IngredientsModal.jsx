import React from 'react';
import { X, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function IngredientsModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '460px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ marginBottom: '1.2rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#fc5200',
            background: '#fff2eb',
            padding: '0.2rem 0.6rem',
            borderRadius: '4px'
          }}>
            DBMS 3NF Relation: FOOD_INGREDIENT
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '0.6rem', color: '#1e1e24' }}>
            {item.Name}
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#686b78', marginTop: '0.2rem' }}>
            {item.Description}
          </p>
        </div>

        <div style={{ background: '#f8f9fa', padding: '1.2rem', borderRadius: '14px', border: '1px solid #e9ecef' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: '800', marginBottom: '0.8rem', color: '#1e1e24' }}>
            Ingredients & Recipe Breakdown:
          </h4>

          {item.ingredients && item.ingredients.length > 0 ? (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {item.ingredients.map((ing, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.92rem', color: '#374151' }}>
                  <CheckCircle2 size={16} color="#0f8a3c" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.88rem', color: '#686b78' }}>
              Standard house spice blend and fresh kitchen ingredients.
            </p>
          )}
        </div>

        <button
          style={{
            marginTop: '1.5rem',
            width: '100%',
            padding: '0.75rem',
            background: '#1e1e24',
            color: '#ffffff',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '0.9rem'
          }}
          onClick={onClose}
        >
          Got It
        </button>
      </div>
    </div>
  );
}
