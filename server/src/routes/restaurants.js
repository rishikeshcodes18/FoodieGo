import express from 'express';
import { db } from '../db.js';
import { syncRestaurantFoodItem } from '../firebase.js';

const router = express.Router();

// GET /api/restaurants - List restaurants with filters and rating aggregation
router.get('/', (req, res) => {
  try {
    const { search, cuisine, isVeg, sort, city } = req.query;

    let query = `
      SELECT 
        r.Restaurant_ID,
        r.Name,
        r.Street,
        r.City,
        r.State,
        r.Postal_Code,
        r.Parent_Restaurant_ID,
        p.Name AS Parent_Restaurant_Name,
        r.Image_URL,
        r.Is_Active,
        COALESCE(vr.Avg_Rating, 4.3) AS Avg_Rating,
        COALESCE(vr.Review_Count, 12) AS Review_Count
      FROM RESTAURANT r
      LEFT JOIN RESTAURANT p ON r.Parent_Restaurant_ID = p.Restaurant_ID
      LEFT JOIN VW_RESTAURANT_RATINGS vr ON r.Restaurant_ID = vr.Restaurant_ID
      WHERE r.Is_Active = 1
    `;

    const params = [];

    if (city) {
      query += ` AND (LOWER(r.City) LIKE LOWER(?) OR LOWER(r.Street) LIKE LOWER(?))`;
      params.push(`%${city.trim()}%`, `%${city.trim()}%`);
    }

    if (search) {
      query += ` AND (
        LOWER(r.Name) LIKE LOWER(?) OR 
        r.Restaurant_ID IN (
          SELECT rc.Restaurant_ID FROM RESTAURANT_CUISINE rc WHERE LOWER(rc.Cuisine_Type) LIKE LOWER(?)
        ) OR
        r.Restaurant_ID IN (
          SELECT fi.Restaurant_ID FROM FOOD_ITEM fi WHERE LOWER(fi.Name) LIKE LOWER(?)
        )
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (cuisine) {
      query += ` AND r.Restaurant_ID IN (
        SELECT rc.Restaurant_ID FROM RESTAURANT_CUISINE rc WHERE LOWER(rc.Cuisine_Type) = LOWER(?)
      )`;
      params.push(cuisine);
    }

    if (isVeg === '1' || isVeg === 'true') {
      query += ` AND r.Restaurant_ID IN (
        SELECT fi.Restaurant_ID FROM FOOD_ITEM fi WHERE fi.Is_Veg = 1
      )`;
    }

    if (sort === 'rating') {
      query += ` ORDER BY Avg_Rating DESC`;
    } else {
      query += ` ORDER BY r.Restaurant_ID ASC`;
    }

    const restaurants = db.prepare(query).all(...params);

    // Attach cuisines and food highlights to each restaurant
    const getCuisines = db.prepare('SELECT Cuisine_Type FROM RESTAURANT_CUISINE WHERE Restaurant_ID = ?');
    const enriched = restaurants.map(r => {
      const cuisines = getCuisines.all(r.Restaurant_ID).map(c => c.Cuisine_Type);
      return {
        ...r,
        cuisines,
        deliveryTime: '25-35 mins',
        deliveryFee: 40,
        offerBadge: r.Restaurant_ID === 'R001' ? '60% OFF UPTO ₹120' : 
                    r.Restaurant_ID === 'R004' ? '50% OFF' : 
                    r.Restaurant_ID === 'R007' ? '20% OFF' : 'ITEMS AT ₹149'
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/restaurants/:id - Detail view with menu items, categories, and ingredients
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = db.prepare(`
      SELECT 
        r.Restaurant_ID,
        r.Name,
        r.Street,
        r.City,
        r.State,
        r.Postal_Code,
        r.Parent_Restaurant_ID,
        p.Name AS Parent_Restaurant_Name,
        r.Image_URL,
        COALESCE(vr.Avg_Rating, 4.3) AS Avg_Rating,
        COALESCE(vr.Review_Count, 15) AS Review_Count
      FROM RESTAURANT r
      LEFT JOIN RESTAURANT p ON r.Parent_Restaurant_ID = p.Restaurant_ID
      LEFT JOIN VW_RESTAURANT_RATINGS vr ON r.Restaurant_ID = vr.Restaurant_ID
      WHERE r.Restaurant_ID = ?
    `).get(id);

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Cuisines
    const cuisines = db.prepare('SELECT Cuisine_Type FROM RESTAURANT_CUISINE WHERE Restaurant_ID = ?')
      .all(id)
      .map(c => c.Cuisine_Type);

    // Child branches if this is a parent restaurant
    const branches = db.prepare('SELECT Restaurant_ID, Name, Street, City FROM RESTAURANT WHERE Parent_Restaurant_ID = ?')
      .all(id);

    // Food items
    const foodItems = db.prepare(`
      SELECT 
        fi.Food_ID,
        fi.Restaurant_ID,
        fi.Name,
        fi.Description,
        fi.Price,
        fi.Category_ID,
        fc.Category_Name,
        fi.Is_Veg,
        fi.Image_URL,
        fi.Is_Available
      FROM FOOD_ITEM fi
      JOIN FOOD_CATEGORY fc ON fi.Category_ID = fc.Category_ID
      WHERE fi.Restaurant_ID = ?
      ORDER BY fc.Category_Name, fi.Price ASC
    `).all(id);

    // Ingredients for each item
    const getIngredients = db.prepare('SELECT Ingredient_Name FROM FOOD_INGREDIENT WHERE Food_ID = ? AND Restaurant_ID = ?');
    const enrichedItems = foodItems.map(item => {
      const ingredients = getIngredients.all(item.Food_ID, id).map(i => i.Ingredient_Name);
      return {
        ...item,
        ingredients
      };
    });

    // Group items by category
    const categoriesMap = {};
    for (const item of enrichedItems) {
      if (!categoriesMap[item.Category_Name]) {
        categoriesMap[item.Category_Name] = {
          categoryId: item.Category_ID,
          categoryName: item.Category_Name,
          items: []
        };
      }
      categoriesMap[item.Category_Name].items.push(item);
    }

    // Recent reviews
    const reviews = db.prepare(`
      SELECT 
        rev.Review_ID,
        rev.Rating,
        rev.Comment_Text,
        rev.Review_Date,
        p.First_Name || ' ' || SUBSTR(p.Last_Name, 1, 1) || '.' AS Reviewer_Name
      FROM REVIEW rev
      JOIN PERSON p ON rev.Customer_ID = p.Person_ID
      WHERE rev.Restaurant_ID = ?
      ORDER BY rev.Review_Date DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...restaurant,
        cuisines,
        branches,
        categories: Object.values(categoriesMap),
        reviews
      }
    });
  } catch (err) {
    console.error('Error fetching restaurant detail:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/restaurants/:id/orders - All orders for a restaurant from SQLite
router.get('/:id/orders', (req, res) => {
  try {
    const { id } = req.params;
    const orders = db.prepare(`
      SELECT 
        o.Order_ID AS orderId,
        o.Customer_ID AS customerId,
        o.Restaurant_ID AS restaurantId,
        o.Order_Date AS createdAt,
        o.Order_Status AS orderStatus,
        p.Amount_Paid AS finalPrice,
        p.Payment_Method AS paymentMethod
      FROM ORDERS o
      LEFT JOIN PAYMENT p ON o.Order_ID = p.Order_ID
      WHERE o.Restaurant_ID = ?
      ORDER BY o.Order_Date DESC
    `).all(id);

    const getItems = db.prepare(`
      SELECT 
        oi.Food_ID AS foodId,
        oi.Quantity AS quantity,
        oi.Item_Price AS price,
        fi.Name AS name
      FROM ORDER_ITEM oi
      JOIN FOOD_ITEM fi ON oi.Food_ID = fi.Food_ID AND oi.Restaurant_ID = fi.Restaurant_ID
      WHERE oi.Order_ID = ?
    `);

    const enriched = orders.map(ord => ({
      ...ord,
      items: getItems.all(ord.orderId)
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('Error fetching restaurant orders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/cuisines
router.get('/meta/cuisines', (req, res) => {
  try {
    const cuisines = db.prepare('SELECT DISTINCT Cuisine_Type FROM RESTAURANT_CUISINE ORDER BY Cuisine_Type ASC').all();
    res.json({ success: true, data: cuisines.map(c => c.Cuisine_Type) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/categories
router.get('/meta/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM FOOD_CATEGORY ORDER BY Category_Name ASC').all();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/restaurants/:id/items - Add food item (Dual-writes to SQLite and Firebase)
router.post('/:id/items', async (req, res) => {
  try {
    const { id: restaurantId } = req.params;
    const { name, description, price, categoryId, categoryName, isVeg, imageUrl } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ success: false, message: 'Name and Price are required' });
    }

    // Verify restaurant exists
    const rest = db.prepare('SELECT Restaurant_ID, Name FROM RESTAURANT WHERE Restaurant_ID = ?').get(restaurantId);
    if (!rest) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Determine category ID
    let finalCatId = categoryId;
    if (!finalCatId && categoryName) {
      const catRow = db.prepare('SELECT Category_ID FROM FOOD_CATEGORY WHERE LOWER(Category_Name) = LOWER(?)').get(categoryName);
      if (catRow) {
        finalCatId = catRow.Category_ID;
      }
    }
    if (!finalCatId) {
      const defaultCat = db.prepare('SELECT Category_ID FROM FOOD_CATEGORY LIMIT 1').get();
      finalCatId = defaultCat ? defaultCat.Category_ID : 'CAT01';
    }

    // Generate new Food_ID
    const lastItem = db.prepare("SELECT Food_ID FROM FOOD_ITEM WHERE Food_ID LIKE 'F%' ORDER BY CAST(SUBSTR(Food_ID, 2) AS INTEGER) DESC LIMIT 1").get();
    let nextNum = 100;
    if (lastItem && lastItem.Food_ID) {
      const parsed = parseInt(lastItem.Food_ID.replace('F', ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    const foodId = `F${String(nextNum).padStart(3, '0')}`;

    // Insert into SQLite
    const insertStmt = db.prepare(`
      INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const vegValue = isVeg === 0 || isVeg === false ? 0 : 1;
    const priceValue = parseFloat(price) || 0;
    const finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';

    insertStmt.run(
      foodId,
      restaurantId,
      name.trim(),
      description ? description.trim() : '',
      priceValue,
      finalCatId,
      vegValue,
      finalImageUrl
    );

    // Fetch created item with Category_Name
    const createdItem = db.prepare(`
      SELECT 
        fi.Food_ID,
        fi.Restaurant_ID,
        fi.Name,
        fi.Description,
        fi.Price,
        fi.Category_ID,
        fc.Category_Name,
        fi.Is_Veg,
        fi.Image_URL,
        fi.Is_Available
      FROM FOOD_ITEM fi
      JOIN FOOD_CATEGORY fc ON fi.Category_ID = fc.Category_ID
      WHERE fi.Food_ID = ? AND fi.Restaurant_ID = ?
    `).get(foodId, restaurantId);

    // Dual-write sync to Firebase RTDB
    await syncRestaurantFoodItem(restaurantId, createdItem);

    res.status(201).json({
      success: true,
      message: 'Food item created and synced to Firebase',
      data: createdItem
    });
  } catch (err) {
    console.error('Error adding food item:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
