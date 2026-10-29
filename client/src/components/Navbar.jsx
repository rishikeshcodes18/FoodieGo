import React from 'react';
import { MapPin, Search, ShoppingBag, Clock, User, ChevronDown, Store } from 'lucide-react';

export default function Navbar({
  selectedCity,
  onOpenCitySelector,
  searchQuery,
  onSearchChange,
  cartItemCount,
  cartTotal,
  onOpenCart,
  onOpenOrders,
  currentUser,
  onOpenAuth,
  onOpenRestaurantDashboard
}) {
  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Left: Brand Logo & City Location */}
        <div className="nav-left">
          <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="brand-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
                <path d="M12 8v8" />
              </svg>
            </div>
            <span>FoodieGo</span>
          </a>

          <div className="location-picker" onClick={onOpenCitySelector} title="Change Delivery Location">
            <MapPin size={16} color="#fc5200" />
            <span>{selectedCity || 'Chennai, Central'}</span>
            <ChevronDown size={14} color="#686b78" />
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="nav-search">
          <Search size={17} className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search for restaurants, cuisine or dishes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Right: Actions */}
        <div className="nav-right">
          <button 
            className="nav-btn nav-btn-partner" 
            onClick={onOpenRestaurantDashboard} 
            title="Meghana Foods Restaurant Dashboard"
            style={{ 
              background: '#fff3ec', 
              color: '#fc5200', 
              fontWeight: '700', 
              border: '1px solid #ffd8c7',
              borderRadius: '9999px',
              padding: '0.45rem 0.85rem'
            }}
          >
            <Store size={16} color="#fc5200" />
            <span>Meghana Foods (Partner)</span>
          </button>

          <button className="nav-btn nav-btn-orders" onClick={onOpenOrders} title="View Past Orders & Reviews">
            <Clock size={17} />
            <span>My Orders</span>
          </button>

          <button className="nav-btn nav-btn-cart" onClick={onOpenCart} title="View Cart">
            <ShoppingBag size={17} />
            <span>Cart</span>
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </button>

          <button className="nav-btn nav-btn-user" onClick={onOpenAuth} title="Customer Profile">
            <User size={16} />
            <span>{currentUser ? currentUser.firstName : 'Sign in'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
