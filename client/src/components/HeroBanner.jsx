import React from 'react';
import { MapPin, Search, ArrowRight, ChevronDown } from 'lucide-react';

export default function HeroBanner({
  offers,
  searchQuery,
  onSearchChange,
  selectedCity,
  onOpenCitySelector,
  onSelectDeliveryCard,
  onSelectDineoutCard,
  currentUser,
  onOpenAuth
}) {
  const deliveryDiscount = offers?.deliveryDiscount;
  const dineoutDiscount = offers?.dineoutDiscount;

  return (
    <section className="hero-wrapper">
      <div className="hero-container">
        {/* Top bar inside hero matching Screenshot 1 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fc5200', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
                <path d="M12 8v8" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
              FoodieGo
            </span>
          </div>

          <button
            onClick={onOpenAuth}
            style={{
              background: '#1e1e24',
              color: '#ffffff',
              padding: '0.65rem 1.4rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: '700',
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {currentUser ? `${currentUser.firstName} (${currentUser.loyaltyPoints || 100} pts)` : 'Sign in'}
          </button>
        </div>

        {/* Main Headline matching Screenshot 1 */}
        <h1 className="hero-title">
          Order food & groceries. Discover your city's best restaurants.
        </h1>
        <p className="hero-subtitle">
          Fast delivery, fresh picks, and delicious moments — all in one place.
        </p>

        {/* Dual Search Input Bar */}
        <div className="hero-search-box">
          <div className="hero-location-select" onClick={onOpenCitySelector} title="Select Delivery Location">
            <MapPin size={18} color="#fc5200" />
            <span>{selectedCity || 'Enter your delivery location'}</span>
            <ChevronDown size={15} color="#686b78" />
          </div>

          <div className="hero-input-group">
            <input
              type="text"
              placeholder="Search for restaurant, item or cuisine"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <Search size={20} color="#686b78" />
          </div>
        </div>

        {/* Dual Promotional Cards */}
        <div className="hero-cards-grid">
          {/* Card 1: FOOD DELIVERY */}
          <div className="hero-promo-card" onClick={onSelectDeliveryCard}>
            <div className="hero-card-content">
              <h3 className="hero-card-title">FOOD DELIVERY</h3>
              <p className="hero-card-subtitle">FROM RESTAURANTS</p>
              
              {/* Dynamic top discount: only show if discount exists */}
              {deliveryDiscount && deliveryDiscount > 0 ? (
                <div className="hero-discount-badge">
                  UP TO {deliveryDiscount}% OFF
                </div>
              ) : null}

              <button className="hero-arrow-btn" aria-label="Explore Food Delivery">
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="hero-card-visual">
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80"
                alt="Fresh Food & Groceries"
                className="hero-card-img-main"
              />
              <img
                src="https://images.unsplash.com/photo-1525351484163-7529414344d8?w=150&q=80"
                alt="Breakfast plate"
                className="hero-card-img-sub"
              />
            </div>
          </div>

          {/* Card 2: DINEOUT */}
          <div className="hero-promo-card" onClick={onSelectDineoutCard}>
            <div className="hero-card-content">
              <h3 className="hero-card-title">DINEOUT</h3>
              <p className="hero-card-subtitle">EAT OUT & SAVE MORE</p>

              {/* Dynamic top discount: only show if discount exists */}
              {dineoutDiscount && dineoutDiscount > 0 ? (
                <div className="hero-discount-badge">
                  UP TO {dineoutDiscount}% OFF
                </div>
              ) : null}

              <button className="hero-arrow-btn" aria-label="Explore Dineout Offers">
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="hero-card-visual">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=80"
                alt="Dineout restaurant dish"
                className="hero-card-img-main"
              />
              <img
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&q=80"
                alt="Gourmet dish"
                className="hero-card-img-sub"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
