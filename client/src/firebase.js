import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';

const firebaseConfig = {
  projectId: 'foodigo-6cf43',
  databaseURL: 'https://foodigo-6cf43-default-rtdb.firebaseio.com'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const rtdb = getDatabase(app);

/**
 * Subscribes to live order tracking in Firebase Realtime Database
 * @param {string} orderId 
 * @param {function} callback Called whenever the order status or delivery updates in real-time
 * @returns {function} Unsubscribe cleanup function
 */
export function subscribeToLiveOrder(orderId, callback) {
  if (!orderId || !rtdb) return () => {};

  const orderRef = ref(rtdb, `live_orders/${orderId}`);
  
  onValue(orderRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      callback(val);
    }
  }, (error) => {
    console.warn(`[Firebase RTDB] Listener warning for ${orderId}:`, error.message);
  });

  return () => {
    try {
      off(orderRef);
    } catch {
      // Ignore unsubscribe error on unmount
    }
  };
}

/**
 * Subscribes to restaurant historical orders in Firebase RTDB
 * @param {string} restaurantId 
 * @param {function} callback 
 */
export function subscribeToRestaurantHistoricalOrders(restaurantId = 'R001', callback) {
  if (!rtdb) return () => {};

  const histRef = ref(rtdb, `historical_orders/${restaurantId}`);

  onValue(histRef, (snapshot) => {
    const val = snapshot.val();
    callback(val || {});
  }, (error) => {
    console.warn(`[Firebase RTDB] Historical orders warning for ${restaurantId}:`, error.message);
  });

  return () => {
    try {
      off(histRef);
    } catch {}
  };
}

/**
 * Subscribes to live orders in Firebase RTDB
 * @param {function} callback 
 */
export function subscribeToLiveOrders(callback) {
  if (!rtdb) return () => {};

  const liveRef = ref(rtdb, 'live_orders');

  onValue(liveRef, (snapshot) => {
    const val = snapshot.val();
    callback(val || {});
  }, (error) => {
    console.warn('[Firebase RTDB] Live orders listener warning:', error.message);
  });

  return () => {
    try {
      off(liveRef);
    } catch {}
  };
}

/**
 * Subscribes to custom restaurant menu items synced in Firebase
 * @param {string} restaurantId 
 * @param {function} callback 
 */
export function subscribeToRestaurantMenu(restaurantId = 'R001', callback) {
  if (!rtdb) return () => {};

  const menuRef = ref(rtdb, `restaurant_menu/${restaurantId}`);

  onValue(menuRef, (snapshot) => {
    const val = snapshot.val();
    callback(val || {});
  }, (error) => {
    console.warn(`[Firebase RTDB] Menu items listener warning:`, error.message);
  });

  return () => {
    try {
      off(menuRef);
    } catch {}
  };
}
