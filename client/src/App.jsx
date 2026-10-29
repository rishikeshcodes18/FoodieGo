import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import CuisineCarousel from './components/CuisineCarousel';
import RestaurantList from './components/RestaurantList';
import RestaurantDetailModal from './components/RestaurantDetailModal';
import IngredientsModal from './components/IngredientsModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import ReviewModal from './components/ReviewModal';
import AuthModal from './components/AuthModal';
import RestaurantDashboard from './components/RestaurantDashboard';

export default function App() {
  // View mode: 'store' (customer app) or 'restaurant' (Meghana Foods dashboard)
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#restaurant' || window.location.hash === '#dashboard' || window.location.search.includes('view=restaurant')) {
        return 'restaurant';
      }
    }
    return 'store';
  });

  // Listen to hash changes for direct linking
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#restaurant' || window.location.hash === '#dashboard' || window.location.search.includes('view=restaurant')) {
        setCurrentView('restaurant');
      } else {
        setCurrentView('store');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Global & Customer State from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('foodiego_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const savedCity = localStorage.getItem('foodiego_city');
      if (savedCity) return savedCity;
      const savedUser = localStorage.getItem('foodiego_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.addresses && u.addresses.length > 0) {
          const addr = u.addresses.find(a => a.Is_Default === 1 || a.isDefault === 1) || u.addresses[0];
          const c = addr.City || addr.city;
          if (c) {
            const s = addr.Street || addr.street || '';
            const brief = s ? s.split(',')[0].trim() : '';
            return brief ? `${c}, ${brief}` : c;
          }
        }
      }
      return 'Chennai, Central';
    } catch {
      return 'Chennai, Central';
    }
  });

  const [offers, setOffers] = useState(null); // { deliveryDiscount, dineoutDiscount }
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState(null);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [minRating, setMinRating] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  // Active Modals & Overlays
  const [selectedRestaurantDetail, setSelectedRestaurantDetail] = useState(null);
  const [inspectingItem, setInspectingItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [ordersHistory, setOrdersHistory] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);

  // Customer Addresses from logged in customer
  const [addresses, setAddresses] = useState(() => {
    try {
      const savedUser = localStorage.getItem('foodiego_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return u.addresses || [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Cart State
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isAdvancingStatus, setIsAdvancingStatus] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch active top offers dynamically on mount
  useEffect(() => {
    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOffers(data.data);
        }
      })
      .catch(err => console.error('Failed to load offers:', err));
  }, []);

  // Helper to sync delivery city from customer address
  const updateLocationFromAddresses = (addrList) => {
    if (addrList && addrList.length > 0) {
      const addr = addrList.find(a => a.Is_Default === 1 || a.isDefault === 1) || addrList[0];
      const city = addr.City || addr.city;
      if (city) {
        const street = addr.Street || addr.street || '';
        const streetBrief = street ? street.split(',')[0].trim() : '';
        const loc = streetBrief ? `${city}, ${streetBrief}` : city;
        setSelectedCity(loc);
        try {
          localStorage.setItem('foodiego_city', loc);
        } catch (e) {}
      }
    }
  };

  // Fetch restaurants matching filters and city
  useEffect(() => {
    setLoadingRestaurants(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedCuisine) params.append('cuisine', selectedCuisine);
    if (isVegOnly) params.append('isVeg', '1');
    if (sortBy === 'rating') params.append('sort', 'rating');

    // Robustly extract City from selected location (e.g. "Chennai" from "Chennai, Anna Nagar")
    let cityName = '';
    if (selectedCity && !selectedCity.toLowerCase().includes('enter your delivery location')) {
      const parts = selectedCity.split(',').map(p => p.trim());
      const knownCities = ['chennai', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad'];
      const matched = parts.find(p => knownCities.includes(p.toLowerCase()));
      cityName = matched || parts[0];
    }
    if (cityName) {
      params.append('city', cityName);
    }

    fetch(`/api/restaurants?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          let list = data.data;
          if (minRating) {
            list = list.filter(r => Number(r.Avg_Rating) >= 4.5);
          }
          setRestaurants(list);
        }
        setLoadingRestaurants(false);
      })
      .catch(err => {
        console.error('Error fetching restaurants:', err);
        setLoadingRestaurants(false);
      });
  }, [searchQuery, selectedCuisine, isVegOnly, minRating, sortBy, selectedCity]);

  // Sync Customer Addresses & update location when currentUser changes
  useEffect(() => {
    if (currentUser?.personId) {
      fetch(`/api/customers/${currentUser.personId}/addresses`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.length) {
            setAddresses(data.data);
            updateLocationFromAddresses(data.data);
          }
        })
        .catch(err => console.error('Error fetching addresses:', err));
    }
  }, [currentUser?.personId]);

  // Fetch Order History
  const fetchOrderHistory = () => {
    const custId = currentUser?.personId || currentUser?.Person_ID || currentUser?.Customer_ID;
    if (!custId) {
      setOrdersHistory([]);
      return;
    }
    setLoadingOrders(true);
    fetch(`/api/orders/customer/${custId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrdersHistory(data.data || []);
        }
        setLoadingOrders(false);
      })
      .catch(err => {
        console.error('Error fetching order history:', err);
        setLoadingOrders(false);
      });
  };

  // Open restaurant detail
  const handleOpenRestaurant = (restaurantId) => {
    fetch(`/api/restaurants/${restaurantId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSelectedRestaurantDetail(data.data);
        }
      })
      .catch(err => console.error('Error loading restaurant detail:', err));
  };

  // Cart operations
  const handleAddToCart = (item, restaurant) => {
    if (cartRestaurant && cartRestaurant.Restaurant_ID !== restaurant.Restaurant_ID) {
      if (!window.confirm(`Your cart contains items from ${cartRestaurant.Name}. Clear cart to add items from ${restaurant.Name}?`)) {
        return;
      }
      setCart([]);
      setAppliedCoupon(null);
    }

    setCartRestaurant(restaurant);
    setCart(prev => [
      ...prev,
      {
        foodId: item.Food_ID,
        restaurantId: restaurant.Restaurant_ID,
        name: item.Name,
        price: Number(item.Price),
        isVeg: item.Is_Veg === 1,
        quantity: 1
      }
    ]);
  };

  const handleUpdateQuantity = (foodId, newQuantity) => {
    if (newQuantity <= 0) {
      const updated = cart.filter(it => it.foodId !== foodId);
      setCart(updated);
      if (updated.length === 0) {
        setCartRestaurant(null);
        setAppliedCoupon(null);
      }
    } else {
      setCart(prev => prev.map(it => it.foodId === foodId ? { ...it, quantity: newQuantity } : it));
    }
  };

  // Apply Coupon
  const handleApplyCoupon = (code) => {
    setCouponError('');
    const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);

    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAppliedCoupon(data.data);
        } else {
          setCouponError(data.message || 'Failed to apply coupon');
        }
      })
      .catch(err => setCouponError('Error validating coupon. Please try again.'));
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Add Address
  const handleAddNewAddress = (newAddr) => {
    fetch(`/api/customers/${currentUser.personId}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAddr)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAddresses(prev => [data.data, ...prev]);
        }
      })
      .catch(err => console.error('Error adding address:', err));
  };

  // Place Order
  const handlePlaceOrder = ({ addressId, paymentMethod, specialInstructions }) => {
    const custId = currentUser?.personId || currentUser?.Person_ID || currentUser?.Customer_ID;
    if (!cart.length || !cartRestaurant || !custId) return;
    setIsPlacingOrder(true);

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: custId,
        restaurantId: cartRestaurant.Restaurant_ID,
        addressId,
        couponId: appliedCoupon ? appliedCoupon.code : null,
        items: cart,
        specialInstructions,
        paymentMethod
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsPlacingOrder(false);
        if (data.success) {
          // Clear cart
          setCart([]);
          setCartRestaurant(null);
          setAppliedCoupon(null);
          setIsCheckoutOpen(false);
          setIsCartOpen(false);

          // Refresh order history immediately
          fetchOrderHistory();

          // Fetch fresh tracking data and open tracker
          fetch(`/api/orders/${data.data.orderId}`)
            .then(r => r.json())
            .then(tData => {
              if (tData.success) {
                setActiveTrackingOrder(tData.data);
              }
            });
        } else {
          alert(data.message || 'Failed to place order.');
        }
      })
      .catch(err => {
        setIsPlacingOrder(false);
        alert('Network error while placing order.');
      });
  };

  // Advance Order Lifecycle (Live Demo Simulation)
  const handleAdvanceStatus = (orderId) => {
    setIsAdvancingStatus(true);
    fetch(`/api/orders/${orderId}/advance`, { method: 'PATCH' })
      .then(res => res.json())
      .then(data => {
        setIsAdvancingStatus(false);
        if (data.success) {
          // Re-fetch order tracking
          fetch(`/api/orders/${orderId}`)
            .then(r => r.json())
            .then(tData => {
              if (tData.success) {
                setActiveTrackingOrder(tData.data);
              }
            });
        }
      })
      .catch(err => {
        setIsAdvancingStatus(false);
        console.error('Error advancing order status:', err);
      });
  };

  // Submit Review
  const handleSubmitReview = ({ orderId, restaurantId, rating, commentText }) => {
    setIsSubmittingReview(true);
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: currentUser.personId,
        restaurantId,
        orderId,
        rating,
        commentText
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsSubmittingReview(false);
        if (data.success) {
          alert('Review submitted! Thank you for helping others discover great food.');
          setReviewOrder(null);
          fetchOrderHistory(); // Refresh
        } else {
          alert(data.message || 'Failed to submit review.');
        }
      })
      .catch(err => {
        setIsSubmittingReview(false);
        alert('Error submitting review.');
      });
  };

  // Hero Card Click Handlers
  const handleSelectDeliveryCard = () => {
    const el = document.getElementById('restaurants-anchor');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectDineoutCard = () => {
    setSelectedCuisine('Burgers'); // Truffles Gourmet Bistro
    const el = document.getElementById('restaurants-anchor');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const cartItemCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const cartTotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);

  if (currentView === 'restaurant') {
    return (
      <RestaurantDashboard 
        onBackToStore={() => {
          setCurrentView('store');
          window.location.hash = '';
        }} 
      />
    );
  }

  return (
    <div className="foodiego-app">
      {/* Navbar Header */}
      <Navbar
        selectedCity={selectedCity}
        onOpenCitySelector={() => setIsCityPickerOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartItemCount={cartItemCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => {
          setIsOrdersOpen(true);
          const custId = currentUser?.personId || currentUser?.Person_ID || currentUser?.Customer_ID;
          if (custId) {
            fetchOrderHistory();
          }
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenRestaurantDashboard={() => {
          setCurrentView('restaurant');
          window.location.hash = '#restaurant';
        }}
      />

      {/* Hero Banner with Dynamic Top Discounts */}
      <HeroBanner
        offers={offers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onOpenCitySelector={() => setIsCityPickerOpen(true)}
        onSelectDeliveryCard={handleSelectDeliveryCard}
        onSelectDineoutCard={handleSelectDineoutCard}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* 14-Dish Craving Carousel (Matching Screenshot 2) */}
      <CuisineCarousel
        selectedCuisine={selectedCuisine}
        onSelectCuisine={(cuisine) => {
          setSelectedCuisine(cuisine);
          const el = document.getElementById('restaurants-anchor');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Restaurant Listings */}
      <RestaurantList
        restaurants={restaurants}
        loading={loadingRestaurants}
        selectedCuisine={selectedCuisine}
        onSelectCuisine={setSelectedCuisine}
        isVegOnly={isVegOnly}
        onToggleVeg={() => setIsVegOnly(!isVegOnly)}
        minRating={minRating}
        onToggleRating={() => setMinRating(!minRating)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onSelectRestaurant={handleOpenRestaurant}
      />

      {/* Modal: Restaurant Detail & Menu */}
      {selectedRestaurantDetail && (
        <RestaurantDetailModal
          restaurant={selectedRestaurantDetail}
          onClose={() => setSelectedRestaurantDetail(null)}
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          onViewIngredients={(item) => setInspectingItem(item)}
        />
      )}

      {/* Modal: FOOD_INGREDIENT 3NF Recipe Breakdown */}
      {inspectingItem && (
        <IngredientsModal
          item={inspectingItem}
          onClose={() => setInspectingItem(null)}
        />
      )}

      {/* Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cartRestaurant={cartRestaurant}
        onUpdateQuantity={handleUpdateQuantity}
        couponCode={appliedCoupon?.code}
        appliedCoupon={appliedCoupon}
        couponError={couponError}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        specialInstructions={specialInstructions}
        onUpdateInstructions={setSpecialInstructions}
        onProceedToCheckout={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
            return;
          }
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Modal: Checkout & Mock Payment */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        cartRestaurant={cartRestaurant}
        appliedCoupon={appliedCoupon}
        specialInstructions={specialInstructions}
        addresses={addresses}
        onAddNewAddress={handleAddNewAddress}
        onPlaceOrder={handlePlaceOrder}
        isPlacing={isPlacingOrder}
      />

      {/* Modal: Live 5-Stage Order Tracking */}
      {activeTrackingOrder && (
        <OrderTrackingModal
          order={activeTrackingOrder}
          onClose={() => setActiveTrackingOrder(null)}
          onAdvanceStatus={handleAdvanceStatus}
          isAdvancing={isAdvancingStatus}
          onOpenReview={(ord) => setReviewOrder(ord)}
        />
      )}

      {/* Modal: Order History */}
      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        orders={ordersHistory}
        loading={loadingOrders}
        onTrackOrder={(orderId) => {
          fetch(`/api/orders/${orderId}`)
            .then(r => r.json())
            .then(tData => {
              if (tData.success) {
                setActiveTrackingOrder(tData.data);
              }
            });
        }}
        onOpenReview={(ord) => setReviewOrder(ord)}
        onReorder={(ord) => {
          // Reorder items
          handleOpenRestaurant(ord.Restaurant_ID);
        }}
      />

      {/* Modal: Rate & Review Order */}
      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSubmitReview={handleSubmitReview}
          isSubmitting={isSubmittingReview}
        />
      )}

      {/* Modal: Customer Auth (Sign In / Create Account / Profile) */}
      {/* Modal: Customer Auth (Sign In / Create Account / Profile) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(userData) => {
          setCurrentUser(userData);
          try {
            localStorage.setItem('foodiego_user', JSON.stringify(userData));
          } catch (e) {}

          if (userData.addresses && userData.addresses.length) {
            setAddresses(userData.addresses);
            updateLocationFromAddresses(userData.addresses);
          }
        }}
        onLogout={() => {
          setCurrentUser(null);
          setAddresses([]);
          try {
            localStorage.removeItem('foodiego_user');
          } catch (e) {}
        }}
      />

      {/* Modal: Select Delivery City */}
      {isCityPickerOpen && (
        <div className="modal-overlay" onClick={() => setIsCityPickerOpen(false)} style={{ zIndex: 1500 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsCityPickerOpen(false)}>
              ✕
            </button>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.4rem', color: '#1e1e24' }}>
              Select Delivery City
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#686b78', marginBottom: '1.2rem' }}>
              Choose your city to discover local restaurants and offers
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { city: 'Chennai', tag: 'Tamil Nadu • Anna Nagar, T. Nagar, Mylapore' },
                { city: 'Bangalore', tag: 'Karnataka • Indiranagar, Koramangala' },
                { city: 'Mumbai', tag: 'Maharashtra • Bandra, Andheri' },
                { city: 'Delhi', tag: 'NCR • Connaught Place, South Ex' },
                { city: 'Hyderabad', tag: 'Telangana • Banjara Hills, Hitec City' }
              ].map(c => (
                <div
                  key={c.city}
                  onClick={() => {
                    const newCity = `${c.city}, Central`;
                    setSelectedCity(newCity);
                    try {
                      localStorage.setItem('foodiego_city', newCity);
                    } catch (e) {}
                    setIsCityPickerOpen(false);
                  }}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedCity.toLowerCase().includes(c.city.toLowerCase()) ? '#fc5200' : '#e2e8f0'}`,
                    background: selectedCity.toLowerCase().includes(c.city.toLowerCase()) ? '#fff2eb' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#1e1e24', display: 'block' }}>{c.city}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#686b78' }}>{c.tag}</span>
                  </div>
                  {selectedCity.toLowerCase().includes(c.city.toLowerCase()) && (
                    <span style={{ color: '#fc5200', fontWeight: '800', fontSize: '0.8rem' }}>SELECTED</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
