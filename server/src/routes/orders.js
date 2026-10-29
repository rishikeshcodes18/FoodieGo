import express from 'express';
import { db } from '../db.js';
import { syncLiveOrder, updateLiveDeliveryStatus } from '../firebase.js';

const router = express.Router();

// POST /api/orders - Place a new customer order
router.post('/', (req, res) => {
  try {
    const {
      customerId = 'P001',
      restaurantId,
      addressId,
      couponId = null,
      items,
      specialInstructions = '',
      paymentMethod = 'UPI'
    } = req.body;

    if (!restaurantId || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Restaurant and items are required' });
    }

    // Default address if not provided
    let effectiveAddressId = addressId;
    if (!effectiveAddressId) {
      const defaultAddr = db.prepare('SELECT Address_ID FROM ADDRESS WHERE Customer_ID = ? LIMIT 1').get(customerId);
      effectiveAddressId = defaultAddr ? defaultAddr.Address_ID : 'A001';
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const it of items) {
      subtotal += Number(it.price) * Number(it.quantity);
    }

    // Calculate coupon discount
    let discountAmount = 0;
    let validatedCouponId = null;
    if (couponId) {
      const coupon = db.prepare('SELECT * FROM COUPON WHERE Coupon_ID = ? OR Code = ?').get(couponId, couponId);
      if (coupon && subtotal >= coupon.Min_Order_Amount) {
        validatedCouponId = coupon.Coupon_ID;
        const rawDiscount = subtotal * (coupon.Discount_Percentage / 100);
        discountAmount = Math.min(rawDiscount, coupon.Max_Discount_Amount);
      }
    }

    const deliveryFee = subtotal > 500 ? 0 : 40.0;
    const taxAmount = Number((subtotal * 0.05).toFixed(2));
    const finalPrice = Number((subtotal - discountAmount + deliveryFee + taxAmount).toFixed(2));

    const orderId = `ORD${Date.now().toString().slice(-6)}`;
    const paymentId = `PAY${Date.now().toString().slice(-6)}`;
    const deliveryId = `DEL${Date.now().toString().slice(-6)}`;

    // 1. Insert into ORDERS
    db.prepare(`
      INSERT INTO ORDERS (
        Order_ID, Customer_ID, Restaurant_ID, Address_ID, Coupon_ID, 
        Order_Date, Order_Status, Special_Instructions, Delivery_Fee, Tax_Amount
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), 'PLACED', ?, ?, ?)
    `).run(
      orderId,
      customerId,
      restaurantId,
      effectiveAddressId,
      validatedCouponId,
      specialInstructions,
      deliveryFee,
      taxAmount
    );

    // 2. Insert into ORDER_ITEM (consolidated by foodId to prevent duplicate key collisions)
    const insertOrderItem = db.prepare(`
      INSERT INTO ORDER_ITEM (Order_ID, Food_ID, Restaurant_ID, Quantity, Item_Price)
      VALUES (?, ?, ?, ?, ?)
    `);

    const consolidatedItems = {};
    for (const it of items) {
      const fId = it.foodId || it.Food_ID;
      const p = Number(it.price ?? it.Price ?? 0);
      const q = Number(it.quantity ?? it.Quantity ?? 1);
      if (!fId) continue;
      if (!consolidatedItems[fId]) {
        let dishName = it.name || it.foodName || it.Food_Name;
        if (!dishName) {
          const foodRow = db.prepare('SELECT Name FROM FOOD_ITEM WHERE Food_ID = ? AND Restaurant_ID = ?').get(fId, restaurantId);
          dishName = foodRow ? foodRow.Name : 'Dish';
        }
        consolidatedItems[fId] = { foodId: fId, name: dishName, price: p, quantity: 0 };
      }
      consolidatedItems[fId].quantity += q;
    }

    for (const fId of Object.keys(consolidatedItems)) {
      const it = consolidatedItems[fId];
      insertOrderItem.run(orderId, it.foodId, restaurantId, it.quantity, it.price);
    }

    // 3. Insert into PAYMENT
    const txRef = `${paymentMethod.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    db.prepare(`
      INSERT INTO PAYMENT (Payment_ID, Order_ID, Payment_Method, Payment_Status, Payment_Date, Amount_Paid, Transaction_Ref)
      VALUES (?, ?, ?, 'COMPLETED', datetime('now'), ?, ?)
    `).run(paymentId, orderId, paymentMethod, finalPrice, txRef);

    // 4. Assign an available DELIVERY_PARTNER
    let partner = db.prepare(`
      SELECT dp.Partner_ID, p.First_Name || ' ' || p.Last_Name AS Partner_Name, dp.Vehicle_Type
      FROM DELIVERY_PARTNER dp
      JOIN PERSON p ON dp.Partner_ID = p.Person_ID
      WHERE dp.Availability_Status = 'AVAILABLE'
      LIMIT 1
    `).get();

    if (!partner) {
      partner = { Partner_ID: 'P004', Partner_Name: 'Vikram Singh', Vehicle_Type: 'BIKE' };
    }

    // Pickup_Time and Delivery_Time are NULL at placement – they will be
    // stamped with the real current time as the order advances through statuses.
    db.prepare(`
      INSERT INTO DELIVERY (Delivery_ID, Order_ID, Partner_ID, Pickup_Time, Delivery_Time, Delivery_Status)
      VALUES (?, ?, ?, NULL, NULL, 'ASSIGNED')
    `).run(deliveryId, orderId, partner.Partner_ID);

    // Add loyalty points to customer
    db.prepare('UPDATE CUSTOMER SET Loyalty_Points = Loyalty_Points + ? WHERE Customer_ID = ?')
      .run(Math.floor(finalPrice / 10), customerId);

    // Calculate total quantity of items (e.g. 3 Burgers + 2 Cokes = 5 items)
    const totalQuantity = Object.values(consolidatedItems).reduce((sum, it) => sum + it.quantity, 0);

    // Dual-write live tracking state to Firebase Realtime Database
    syncLiveOrder(orderId, {
      orderId,
      customerId,
      restaurantId,
      orderStatus: 'PLACED',
      deliveryStatus: 'ASSIGNED',
      finalPrice,
      deliveryFee,
      taxAmount,
      partnerName: partner.Partner_Name,
      vehicleType: partner.Vehicle_Type,
      itemsCount: totalQuantity,
      uniqueDishesCount: Object.keys(consolidatedItems).length,
      items: Object.values(consolidatedItems).map(it => ({
        foodId: it.foodId,
        name: it.foodName || it.name || 'Dish',
        quantity: it.quantity,
        price: it.price
      })),
      createdAt: new Date().toISOString()
    }).catch(e => console.warn('[Firebase] Background sync note:', e.message));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: {
        orderId,
        finalPrice,
        subtotal,
        discountAmount,
        deliveryFee,
        taxAmount,
        partnerName: partner.Partner_Name,
        paymentStatus: 'COMPLETED',
        transactionRef: txRef
      }
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: err.message, error: err.message });
  }
});

// GET /api/orders/customer/:customerId - Order history
router.get('/customer/:customerId', (req, res) => {
  try {
    const { customerId } = req.params;

    const orders = db.prepare(`
      SELECT 
        o.Order_ID,
        o.Restaurant_ID,
        r.Name AS Restaurant_Name,
        r.Image_URL AS Restaurant_Image,
        o.Order_Date,
        o.Order_Status,
        o.Delivery_Fee,
        o.Tax_Amount,
        p.Payment_Method,
        p.Amount_Paid,
        rev.Review_ID,
        rev.Rating AS Review_Rating
      FROM ORDERS o
      JOIN RESTAURANT r ON o.Restaurant_ID = r.Restaurant_ID
      LEFT JOIN PAYMENT p ON o.Order_ID = p.Order_ID
      LEFT JOIN REVIEW rev ON o.Order_ID = rev.Order_ID
      WHERE o.Customer_ID = ?
      ORDER BY o.Order_Date DESC
    `).all(customerId);

    const getItems = db.prepare(`
      SELECT 
        oi.Food_ID,
        oi.Quantity,
        oi.Item_Price,
        fi.Name AS Food_Name,
        fi.Is_Veg
      FROM ORDER_ITEM oi
      JOIN FOOD_ITEM fi ON oi.Food_ID = fi.Food_ID AND oi.Restaurant_ID = fi.Restaurant_ID
      WHERE oi.Order_ID = ?
    `);

    const enrichedOrders = orders.map(ord => ({
      ...ord,
      items: getItems.all(ord.Order_ID),
      hasReviewed: Boolean(ord.Review_ID)
    }));

    res.json({ success: true, count: enrichedOrders.length, data: enrichedOrders });
  } catch (err) {
    console.error('Error fetching order history:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id - Live order tracking
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare(`
      SELECT 
        o.Order_ID,
        o.Customer_ID,
        o.Restaurant_ID,
        r.Name AS Restaurant_Name,
        r.Street || ', ' || r.City AS Restaurant_Address,
        r.Image_URL AS Restaurant_Image,
        o.Order_Date,
        o.Order_Status,
        o.Special_Instructions,
        o.Delivery_Fee,
        o.Tax_Amount,
        a.Street || ', ' || a.City || ' - ' || a.Postal_Code AS Delivery_Address,
        a.Address_Type,
        pay.Payment_Method,
        pay.Amount_Paid,
        pay.Transaction_Ref,
        del.Delivery_Status,
        del.Pickup_Time,
        del.Delivery_Time,
        dp.Vehicle_Type,
        dp.License_Number,
        dp_person.First_Name || ' ' || dp_person.Last_Name AS Partner_Name,
        dp_phone.Phone_Number AS Partner_Phone
      FROM ORDERS o
      JOIN RESTAURANT r ON o.Restaurant_ID = r.Restaurant_ID
      JOIN ADDRESS a ON o.Address_ID = a.Address_ID
      LEFT JOIN PAYMENT pay ON o.Order_ID = pay.Order_ID
      LEFT JOIN DELIVERY del ON o.Order_ID = del.Order_ID
      LEFT JOIN DELIVERY_PARTNER dp ON del.Partner_ID = dp.Partner_ID
      LEFT JOIN PERSON dp_person ON dp.Partner_ID = dp_person.Person_ID
      LEFT JOIN PERSON_PHONE dp_phone ON dp.Partner_ID = dp_phone.Person_ID
      WHERE o.Order_ID = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const items = db.prepare(`
      SELECT 
        oi.Food_ID,
        oi.Quantity,
        oi.Item_Price,
        fi.Name AS Food_Name,
        fi.Is_Veg
      FROM ORDER_ITEM oi
      JOIN FOOD_ITEM fi ON oi.Food_ID = fi.Food_ID AND oi.Restaurant_ID = fi.Restaurant_ID
      WHERE oi.Order_ID = ?
    `).all(id);

    res.json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (err) {
    console.error('Error fetching order tracking:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id/advance - Advance delivery simulation
router.patch('/:id/advance', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT Order_Status FROM ORDERS WHERE Order_ID = ?').get(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const transitions = {
      'PLACED': 'CONFIRMED',
      'CONFIRMED': 'PREPARING',
      'PREPARING': 'OUT_FOR_DELIVERY',
      'OUT_FOR_DELIVERY': 'DELIVERED',
      'DELIVERED': 'DELIVERED'
    };

    const nextStatus = transitions[order.Order_Status] || 'DELIVERED';
    db.prepare('UPDATE ORDERS SET Order_Status = ? WHERE Order_ID = ?').run(nextStatus, id);

    let deliveryStatus = 'ASSIGNED';
    if (nextStatus === 'OUT_FOR_DELIVERY') {
      // Partner has physically picked up the order right now
      deliveryStatus = 'IN_TRANSIT';
      db.prepare(`
        UPDATE DELIVERY
        SET Delivery_Status = ?, Pickup_Time = datetime('now', 'localtime')
        WHERE Order_ID = ?
      `).run(deliveryStatus, id);
    } else if (nextStatus === 'DELIVERED') {
      // Order has just been handed to the customer right now
      deliveryStatus = 'DELIVERED';
      db.prepare(`
        UPDATE DELIVERY
        SET Delivery_Status = ?, Delivery_Time = datetime('now', 'localtime')
        WHERE Order_ID = ?
      `).run(deliveryStatus, id);
    } else {
      db.prepare('UPDATE DELIVERY SET Delivery_Status = ? WHERE Order_ID = ?').run(deliveryStatus, id);
    }

    // Dual-write status progression to Firebase Realtime Database
    updateLiveDeliveryStatus(id, {
      orderStatus: nextStatus,
      deliveryStatus,
      pickupTime: nextStatus === 'OUT_FOR_DELIVERY' ? new Date().toISOString() : undefined,
      deliveryTime: nextStatus === 'DELIVERED' ? new Date().toISOString() : undefined
    }).catch(e => console.warn('[Firebase] Status update note:', e.message));

    res.json({ success: true, newStatus: nextStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
