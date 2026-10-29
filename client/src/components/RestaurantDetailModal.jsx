import React, { useState } from 'react';
import { X, Star, Clock, MapPin, Sparkles, Info, Plus, Minus, GitBranch } from 'lucide-react';

export default function RestaurantDetailModal({
  restaurant,
  onClose,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onViewIngredients
}) {
  const [vegFilter, setVegFilter] = useState(false);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'reviews'

  if (!restaurant) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content res-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Restaurant Header */}
        <div className="res-detail-header">
          <h2 className="res-detail-title">{restaurant.Name}</h2>
          <div className="res-detail-cuisines">
            {restaurant.cuisines?.join(' • ')}
          </div>
          <div className="res-detail-info-row">
            <div className="rating-badge">
              <Star size={13} fill="#ffffff" />
              <span>{restaurant.Avg_Rating}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>({restaurant.Review_Count}+)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#686b78' }}>
              <Clock size={16} />
              <span>30 mins</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#686b78' }}>
              <MapPin size={16} />
              <span>{restaurant.Street}, {restaurant.City}</span>
            </div>
          </div>

          {/* Recursive Branch Hierarchy display (PRD 3NF Feature) */}
          {restaurant.Parent_Restaurant_Name && (
            <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#4b5563', background: '#f3f4f6', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
              <GitBranch size={16} color="#fc5200" />
              <span>Affiliated Branch of <strong>{restaurant.Parent_Restaurant_Name}</strong></span>
            </div>
          )}

          {restaurant.branches && restaurant.branches.length > 0 && (
            <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: '#686b78' }}>
              <strong>Other Branches:</strong> {restaurant.branches.map(b => b.Name).join(', ')}
            </div>
          )}

          {/* Navigation Sub-Tabs */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #f1f3f5', paddingTop: '0.8rem' }}>
            <button
              style={{
                padding: '0.4rem 0.8rem',
                borderBottom: activeTab === 'menu' ? '2.5px solid #fc5200' : 'none',
                fontWeight: activeTab === 'menu' ? '800' : '600',
                color: activeTab === 'menu' ? '#fc5200' : '#686b78'
              }}
              onClick={() => setActiveTab('menu')}
            >
              Menu
            </button>
            <button
              style={{
                padding: '0.4rem 0.8rem',
                borderBottom: activeTab === 'reviews' ? '2.5px solid #fc5200' : 'none',
                fontWeight: activeTab === 'reviews' ? '800' : '600',
                color: activeTab === 'reviews' ? '#fc5200' : '#686b78'
              }}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({restaurant.reviews?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab 1: Menu Items */}
        {activeTab === 'menu' && (
          <div>
            {/* Veg toggle inside modal */}
            <div style={{ padding: '0.8rem 2rem', background: '#fdfdfd', borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                className={`filter-pill ${vegFilter ? 'veg-active' : ''}`}
                onClick={() => setVegFilter(!vegFilter)}
              >
                <span>Pure Veg Items Only</span>
              </button>
            </div>

            {restaurant.categories?.map((cat) => {
              const filteredItems = vegFilter
                ? cat.items.filter(it => it.Is_Veg === 1)
                : cat.items;

              if (filteredItems.length === 0) return null;

              return (
                <div key={cat.categoryId} className="menu-category-section">
                  <h3 className="category-title">{cat.categoryName} ({filteredItems.length})</h3>

                  <div className="menu-items-list">
                    {filteredItems.map((item) => {
                      const cartItem = cart.find(c => c.foodId === item.Food_ID && c.restaurantId === item.Restaurant_ID);
                      const quantity = cartItem ? cartItem.quantity : 0;

                      return (
                        <div key={item.Food_ID} className="menu-item-card">
                          <div className="menu-item-info">
                            {item.Is_Veg ? (
                              <div className="veg-indicator" title="Vegetarian">
                                <div className="veg-indicator-dot"></div>
                              </div>
                            ) : (
                              <div className="nonveg-indicator" title="Non-Vegetarian">
                                <div className="nonveg-indicator-triangle"></div>
                              </div>
                            )}

                            <h4 className="menu-item-name">{item.Name}</h4>
                            <div className="menu-item-price">₹{Number(item.Price).toFixed(2)}</div>
                            <p className="menu-item-desc">{item.Description}</p>

                            {/* View Ingredients trigger */}
                            {item.ingredients && item.ingredients.length > 0 && (
                              <button
                                className="btn-ingredients"
                                onClick={() => onViewIngredients(item)}
                                title="View ingredients breakdown (FOOD_INGREDIENT 3NF relation)"
                              >
                                <Info size={13} />
                                <span>{item.ingredients.length} Ingredients</span>
                              </button>
                            )}
                          </div>

                          <div className="menu-item-action">
                            {item.Image_URL && (
                              <img
                                src={item.Image_URL}
                                alt={item.Name}
                                className="menu-item-thumb"
                                loading="lazy"
                              />
                            )}

                            {quantity === 0 ? (
                              <button
                                className="btn-add-cart"
                                onClick={() => onAddToCart(item, restaurant)}
                              >
                                ADD
                              </button>
                            ) : (
                              <div className="quantity-stepper">
                                <button onClick={() => onUpdateQuantity(item.Food_ID, quantity - 1)}>
                                  <Minus size={14} />
                                </button>
                                <span>{quantity}</span>
                                <button onClick={() => onUpdateQuantity(item.Food_ID, quantity + 1)}>
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Reviews */}
        {activeTab === 'reviews' && (
          <div style={{ padding: '1.5rem 2rem' }}>
            {restaurant.reviews && restaurant.reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {restaurant.reviews.map(rev => (
                  <div key={rev.Review_ID} style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: '700', color: '#1e1e24' }}>{rev.Reviewer_Name}</span>
                      <div className="rating-badge">
                        <Star size={12} fill="#ffffff" />
                        <span>{rev.Rating}</span>
                      </div>
                    </div>
                    <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>{rev.Comment_Text}</p>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.4rem', display: 'block' }}>
                      {new Date(rev.Review_Date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#686b78', padding: '2rem 0' }}>
                No reviews yet. Be the first to order and review!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
