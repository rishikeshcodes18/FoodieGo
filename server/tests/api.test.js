process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import http from 'node:http';

let server;
const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('🚀 Starting FoodieGo API automated tests...');
  let placedOrderId = null;

  const { default: app } = await import('../src/index.js');
  server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));

  try {
    // 1. Health check
    console.log('✓ Testing /api/health...');
    const health = await request('/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'ok');

    // 2. Offers test (verifies top discounts requirement)
    console.log('✓ Testing /api/offers...');
    const offers = await request('/api/offers');
    assert.strictEqual(offers.status, 200);
    assert.strictEqual(offers.data.success, true);
    assert.strictEqual(typeof offers.data.data.deliveryDiscount, 'number');
    console.log(`  Top Delivery Discount: ${offers.data.data.deliveryDiscount}%`);
    console.log(`  Top Dineout Discount: ${offers.data.data.dineoutDiscount}%`);

    // 3. Restaurants list test
    console.log('✓ Testing /api/restaurants...');
    const restaurants = await request('/api/restaurants');
    assert.strictEqual(restaurants.status, 200);
    assert.ok(restaurants.data.data.length > 0, 'Should return restaurant list');
    const flagship = restaurants.data.data.find(r => r.Restaurant_ID === 'R001');
    assert.ok(flagship, 'R001 flagship restaurant should be present');
    assert.ok(flagship.cuisines.includes('Biryani'), 'Should have Biryani cuisine');

    // 4. Restaurant detail & ingredients test (3NF composite keys)
    console.log('✓ Testing /api/restaurants/:id with ingredients...');
    const detail = await request('/api/restaurants/R001');
    assert.strictEqual(detail.status, 200);
    assert.ok(detail.data.data.categories.length > 0, 'Should have categories');
    const firstItem = detail.data.data.categories[0].items[0];
    assert.ok(firstItem.ingredients.length > 0, 'Food item should have ingredients');

    // 5. Coupon validation test
    console.log('✓ Testing /api/coupons/validate...');
    const validCoupon = await request('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code: 'WELCOME50', subtotal: 300 })
    });
    assert.strictEqual(validCoupon.status, 200);
    assert.strictEqual(validCoupon.data.data.discountAmount, 100);

    // 6. Order placement test
    console.log('✓ Testing /api/orders (Order placement)...');
    const orderRes = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerId: 'P001',
        restaurantId: 'R001',
        addressId: 'A001',
        couponId: 'WELCOME50',
        items: [{ foodId: 'F001', quantity: 2, price: 340.0 }],
        specialInstructions: 'Test order from automated suite',
        paymentMethod: 'UPI'
      })
    });
    assert.strictEqual(orderRes.status, 201);
    assert.ok(orderRes.data.data.orderId, 'Should return generated orderId');
    placedOrderId = orderRes.data.data.orderId;

    // 7. Order tracking test
    console.log('✓ Testing /api/orders/:id (Live Tracking)...');
    const tracking = await request(`/api/orders/${placedOrderId}`);
    assert.strictEqual(tracking.status, 200);
    assert.strictEqual(tracking.data.data.Order_Status, 'PLACED');
    assert.ok(tracking.data.data.Partner_Name, 'Should have assigned partner');

    // 8. Order status advance test
    console.log('✓ Testing /api/orders/:id/advance...');
    const advance = await request(`/api/orders/${placedOrderId}/advance`, { method: 'PATCH' });
    assert.strictEqual(advance.status, 200);
    assert.strictEqual(advance.data.newStatus, 'CONFIRMED');

    // 9. Review submission test
    console.log('✓ Testing /api/reviews...');
    const reviewRes = await request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        customerId: 'P001',
        restaurantId: 'R001',
        orderId: placedOrderId,
        rating: 5,
        commentText: 'Sensational taste and quick packaging!'
      })
    });
    assert.strictEqual(reviewRes.status, 201);
    assert.ok(reviewRes.data.data.newRating > 0, 'Derived rating should update');

    // 10. Customer Account Creation & Sign In Test (3NF PERSON, CUSTOMER, ADDRESS)
    console.log('✓ Testing Customer Sign Up (Create Account with Delivery Address)...');
    const testEmail = `user_${Date.now()}@example.com`;
    const signupRes = await request('/api/customers/signup', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Ananya',
        lastName: 'Verma',
        email: testEmail,
        password: 'securePassword123',
        phone: '+91 9123412345',
        dateOfBirth: '2001-07-22',
        street: 'Flat 102, Green Glen Layout, Bellandur',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560103',
        addressType: 'HOME'
      })
    });
    assert.strictEqual(signupRes.status, 201);
    assert.strictEqual(signupRes.data.success, true);
    assert.strictEqual(signupRes.data.data.loyaltyPoints, 50, 'Welcome bonus should be 50 points');
    assert.strictEqual(signupRes.data.data.addresses.length, 1, 'Should have created initial delivery address in ADDRESS table');
    assert.strictEqual(signupRes.data.data.addresses[0].Street, 'Flat 102, Green Glen Layout, Bellandur');

    console.log('✓ Testing Customer Sign In...');
    const loginRes = await request('/api/customers/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'securePassword123'
      })
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.success, true);
    assert.strictEqual(loginRes.data.data.firstName, 'Ananya');
    assert.strictEqual(loginRes.data.data.addresses[0].Postal_Code, '560103');
    assert.strictEqual(loginRes.data.data.firstName, 'Ananya');

    console.log('🎉 ALL API TESTS PASSED SUCCESSFULLY!');
  } finally {
    // Teardown: Clean up test order so database and Firebase remain 100% clean
    if (placedOrderId) {
      try {
        const { db } = await import('../src/db.js');
        db.prepare('DELETE FROM ORDER_ITEM WHERE Order_ID = ?').run(placedOrderId);
        db.prepare('DELETE FROM DELIVERY WHERE Order_ID = ?').run(placedOrderId);
        db.prepare('DELETE FROM PAYMENT WHERE Order_ID = ?').run(placedOrderId);
        db.prepare('DELETE FROM REVIEW WHERE Order_ID = ?').run(placedOrderId);
        db.prepare('DELETE FROM ORDERS WHERE Order_ID = ?').run(placedOrderId);

        const { rtdb } = await import('../src/firebase.js');
        if (rtdb) {
          await rtdb.ref(`live_orders/${placedOrderId}`).remove();
        }
      } catch (err) {
        // Ignore teardown errors
      }
    }
    server.close();
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  if (server) server.close();
  process.exit(1);
});
