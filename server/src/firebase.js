import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverDir = path.join(__dirname, '..');
let serviceAccountPath = null;

try {
  const files = fs.readdirSync(serverDir);
  for (const file of files) {
    if (file.includes('firebase-adminsdk') && file.endsWith('.json')) {
      serviceAccountPath = path.join(serverDir, file);
      break;
    }
  }
} catch {
  // Ignore directory read errors
}

let rtdb = null;
let enabled = false;
let projectId = 'foodigo-6cf43';

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    projectId = serviceAccount.project_id || projectId;

    const app = getApps().length === 0 ? initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    }) : getApps()[0];

    rtdb = getDatabase(app);
    enabled = true;
    console.log(`[Firebase] Service connected successfully to Realtime Database (${projectId})`);
  } catch (err) {
    console.warn('[Firebase] Initialization note:', err.message);
  }
} else {
  console.log('[Firebase] Service account JSON not found; running with SQLite-only mode.');
}

/**
 * Sync live order tracking state to Firebase for real-time customer updates
 */
export async function syncLiveOrder(orderId, data) {
  if (!enabled || !rtdb) return null;
  try {
    const ref = rtdb.ref(`live_orders/${orderId}`);
    await ref.set({
      ...data,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn(`[Firebase] Failed to sync order ${orderId}:`, err.message);
    return false;
  }
}

/**
 * Update delivery status progression in Firebase
 */
export async function updateLiveDeliveryStatus(orderId, { orderStatus, deliveryStatus, pickupTime, deliveryTime }) {
  if (!enabled || !rtdb) return null;
  try {
    const ref = rtdb.ref(`live_orders/${orderId}`);
    const updates = {
      orderStatus,
      deliveryStatus,
      updatedAt: new Date().toISOString()
    };
    if (pickupTime) updates.pickupTime = pickupTime;
    if (deliveryTime) updates.deliveryTime = deliveryTime;

    await ref.update(updates);
    return true;
  } catch (err) {
    console.warn(`[Firebase] Failed to update delivery status for ${orderId}:`, err.message);
    return false;
  }
}

/**
 * Sync customer review to Firebase Realtime Database
 */
export async function syncLiveReview(reviewId, data) {
  if (!enabled || !rtdb) return null;
  try {
    // 1. Save in reviews collection: reviews/{reviewId}
    const reviewRef = rtdb.ref(`reviews/${reviewId}`);
    await reviewRef.set({
      ...data,
      createdAt: new Date().toISOString()
    });

    // 2. Attach review directly to the order in live_orders/{orderId}/review
    if (data.orderId) {
      await rtdb.ref(`live_orders/${data.orderId}/review`).set({
        reviewId,
        rating: data.rating,
        commentText: data.commentText || '',
        reviewerName: data.reviewerName || 'Customer',
        reviewedAt: new Date().toISOString()
      });
    }

    // 3. Update restaurant dynamic rating snapshot: restaurant_ratings/{restaurantId}
    if (data.restaurantId && data.newRating !== undefined) {
      await rtdb.ref(`restaurant_ratings/${data.restaurantId}`).set({
        rating: data.newRating,
        totalReviews: data.totalReviews,
        updatedAt: new Date().toISOString()
      });
    }

    return true;
  } catch (err) {
    console.warn(`[Firebase] Failed to sync review ${reviewId}:`, err.message);
    return false;
  }
}

/**
 * Sync restaurant food item to Firebase Realtime Database
 */
export async function syncRestaurantFoodItem(restaurantId, foodItem) {
  if (!enabled || !rtdb) return null;
  try {
    const itemRef = rtdb.ref(`restaurant_menu/${restaurantId}/${foodItem.Food_ID || foodItem.foodId}`);
    await itemRef.set({
      foodId: foodItem.Food_ID || foodItem.foodId,
      restaurantId,
      name: foodItem.Name || foodItem.name,
      description: foodItem.Description || foodItem.description || '',
      price: Number(foodItem.Price || foodItem.price),
      categoryId: foodItem.Category_ID || foodItem.categoryId,
      categoryName: foodItem.Category_Name || foodItem.categoryName || '',
      isVeg: foodItem.Is_Veg !== undefined ? Number(foodItem.Is_Veg) : 1,
      imageUrl: foodItem.Image_URL || foodItem.imageUrl || '',
      isAvailable: 1,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn(`[Firebase] Failed to sync food item for ${restaurantId}:`, err.message);
    return false;
  }
}

export function isFirebaseAvailable() {
  return enabled && rtdb !== null;
}

export { rtdb };
