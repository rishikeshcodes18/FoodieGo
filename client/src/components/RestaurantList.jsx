import React from 'react';
import { Star, Clock, Sparkles, Filter, Check } from 'lucide-react';

export default function RestaurantList({
  restaurants,
  loading,
  selectedCuisine,
  onSelectCuisine,
  isVegOnly,
  onToggleVeg,
  minRating,
  onToggleRating,
  sortBy,
  onSortChange,
  onSelectRestaurant
}) {
  return (
    <section className="restaurants-section" id="restaurants-anchor">
      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button
            className={`filter-pill ${!selectedCuisine && !isVegOnly && !minRating ? 'active' : ''}`}
            onClick={() => {
              onSelectCuisine(null);
              if (isVegOnly) onToggleVeg();
              if (minRating) onToggleRating();
            }}
          >
            <Filter size={14} />
            <span>All Restaurants</span>
          </button>

          <button
            className={`filter-pill ${isVegOnly ? 'veg-active' : ''}`}
            onClick={onToggleVeg}
          >
            {isVegOnly && <Check size={14} />}
            <span>Pure Veg</span>
          </button>

          <button
            className={`filter-pill ${minRating ? 'active' : ''}`}
            onClick={onToggleRating}
          >
            <Star size={14} fill={minRating ? '#ffffff' : 'none'} />
            <span>Ratings 4.5+</span>
          </button>

          {selectedCuisine && (
            <button
              className="filter-pill active"
              onClick={() => onSelectCuisine(null)}
            >
              <span>{selectedCuisine}</span>
              <span>✕</span>
            </button>
          )}
        </div>

        <div>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="default">Sort by: Recommended</option>
            <option value="rating">Sort by: Rating (High to Low)</option>
            <option value="deliveryTime">Sort by: Delivery Time</option>
          </select>
        </div>
      </div>

      {/* Grid of Restaurants */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#686b78' }}>
          <p>Loading city's best restaurants...</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#686b78' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>No restaurants found</p>
          <p>Try clearing your filters or searching for something else.</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map((res) => (
            <div
              key={res.Restaurant_ID}
              className="restaurant-card"
              onClick={() => onSelectRestaurant(res.Restaurant_ID)}
            >
              <div className="restaurant-img-wrap">
                <img
                  src={res.Image_URL || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80'}
                  alt={res.Name}
                  className="restaurant-card-img"
                  loading="lazy"
                />
                {res.offerBadge && (
                  <div className="restaurant-offer-tag">
                    {res.offerBadge}
                  </div>
                )}
              </div>

              <div className="restaurant-body">
                <h3 className="restaurant-title" title={res.Name}>{res.Name}</h3>

                <div className="restaurant-meta-row">
                  <div className="rating-badge">
                    <Star size={12} fill="#ffffff" />
                    <span>{res.Avg_Rating}</span>
                  </div>
                  <span className="dot-separator">•</span>
                  <span>{res.deliveryTime}</span>
                </div>

                <div className="restaurant-cuisines">
                  {res.cuisines?.join(', ')}
                </div>

                <div className="restaurant-location">
                  {res.Street}, {res.City}
                </div>

                {/* Demonstration of Recursive Branch relationship from DBMS PRD */}
                {res.Parent_Restaurant_Name && (
                  <div className="branch-badge">
                    Branch of {res.Parent_Restaurant_Name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
