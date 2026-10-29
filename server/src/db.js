import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'foodiego.db');

export const db = new DatabaseSync(dbPath);

// Enable busy timeout first so SQLite waits for any locks to release
try {
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
} catch (err) {
  console.warn('SQLite PRAGMA init note:', err.message);
}

export function initDatabase() {
  db.exec(`
    -- 1. PERSON
    CREATE TABLE IF NOT EXISTS PERSON (
      Person_ID TEXT PRIMARY KEY,
      First_Name TEXT NOT NULL,
      Last_Name TEXT NOT NULL,
      Email TEXT UNIQUE NOT NULL,
      Password TEXT NOT NULL,
      Date_Of_Birth TEXT NOT NULL,
      Created_At TEXT DEFAULT (datetime('now'))
    );

    -- 2. PERSON_PHONE
    CREATE TABLE IF NOT EXISTS PERSON_PHONE (
      Person_ID TEXT NOT NULL,
      Phone_Number TEXT NOT NULL,
      PRIMARY KEY (Person_ID, Phone_Number),
      FOREIGN KEY (Person_ID) REFERENCES PERSON(Person_ID) ON DELETE CASCADE
    );

    -- 3. CUSTOMER
    CREATE TABLE IF NOT EXISTS CUSTOMER (
      Customer_ID TEXT PRIMARY KEY,
      Loyalty_Points INTEGER DEFAULT 0 CHECK (Loyalty_Points >= 0),
      FOREIGN KEY (Customer_ID) REFERENCES PERSON(Person_ID) ON DELETE CASCADE
    );

    -- 4. DELIVERY_PARTNER
    CREATE TABLE IF NOT EXISTS DELIVERY_PARTNER (
      Partner_ID TEXT PRIMARY KEY,
      Vehicle_Type TEXT NOT NULL,
      License_Number TEXT UNIQUE NOT NULL,
      Availability_Status TEXT DEFAULT 'AVAILABLE',
      FOREIGN KEY (Partner_ID) REFERENCES PERSON(Person_ID) ON DELETE CASCADE
    );

    -- 5. RESTAURANT (Parent_Restaurant_ID recursive branch)
    CREATE TABLE IF NOT EXISTS RESTAURANT (
      Restaurant_ID TEXT PRIMARY KEY,
      Name TEXT NOT NULL,
      Street TEXT NOT NULL,
      City TEXT NOT NULL,
      State TEXT NOT NULL,
      Postal_Code TEXT NOT NULL,
      Parent_Restaurant_ID TEXT,
      Image_URL TEXT,
      Is_Active INTEGER DEFAULT 1,
      Created_At TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (Parent_Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID) ON DELETE SET NULL
    );

    -- 6. RESTAURANT_CUISINE
    CREATE TABLE IF NOT EXISTS RESTAURANT_CUISINE (
      Restaurant_ID TEXT NOT NULL,
      Cuisine_Type TEXT NOT NULL,
      PRIMARY KEY (Restaurant_ID, Cuisine_Type),
      FOREIGN KEY (Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID) ON DELETE CASCADE
    );

    -- 7. FOOD_CATEGORY
    CREATE TABLE IF NOT EXISTS FOOD_CATEGORY (
      Category_ID TEXT PRIMARY KEY,
      Category_Name TEXT UNIQUE NOT NULL,
      Description TEXT
    );

    -- 8. FOOD_ITEM (Composite PK: Food_ID, Restaurant_ID)
    CREATE TABLE IF NOT EXISTS FOOD_ITEM (
      Food_ID TEXT NOT NULL,
      Restaurant_ID TEXT NOT NULL,
      Name TEXT NOT NULL,
      Description TEXT,
      Price REAL NOT NULL CHECK (Price >= 0),
      Category_ID TEXT NOT NULL,
      Is_Veg INTEGER DEFAULT 1,
      Image_URL TEXT,
      Is_Available INTEGER DEFAULT 1,
      PRIMARY KEY (Food_ID, Restaurant_ID),
      FOREIGN KEY (Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID) ON DELETE CASCADE,
      FOREIGN KEY (Category_ID) REFERENCES FOOD_CATEGORY(Category_ID)
    );

    -- 9. FOOD_INGREDIENT (Composite FK to FOOD_ITEM)
    CREATE TABLE IF NOT EXISTS FOOD_INGREDIENT (
      Food_ID TEXT NOT NULL,
      Restaurant_ID TEXT NOT NULL,
      Ingredient_Name TEXT NOT NULL,
      PRIMARY KEY (Food_ID, Restaurant_ID, Ingredient_Name),
      FOREIGN KEY (Food_ID, Restaurant_ID) REFERENCES FOOD_ITEM(Food_ID, Restaurant_ID) ON DELETE CASCADE
    );

    -- 10. ADDRESS
    CREATE TABLE IF NOT EXISTS ADDRESS (
      Address_ID TEXT PRIMARY KEY,
      Customer_ID TEXT NOT NULL,
      Street TEXT NOT NULL,
      City TEXT NOT NULL,
      State TEXT NOT NULL,
      Postal_Code TEXT NOT NULL,
      Address_Type TEXT DEFAULT 'HOME',
      Is_Default INTEGER DEFAULT 0,
      FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID) ON DELETE CASCADE
    );

    -- 11. COUPON
    CREATE TABLE IF NOT EXISTS COUPON (
      Coupon_ID TEXT PRIMARY KEY,
      Code TEXT UNIQUE NOT NULL,
      Discount_Percentage REAL NOT NULL CHECK (Discount_Percentage > 0 AND Discount_Percentage <= 100),
      Min_Order_Amount REAL DEFAULT 0,
      Max_Discount_Amount REAL DEFAULT 9999,
      Expiry_Date TEXT NOT NULL,
      Is_Active INTEGER DEFAULT 1
    );

    -- 12. ORDERS
    CREATE TABLE IF NOT EXISTS ORDERS (
      Order_ID TEXT PRIMARY KEY,
      Customer_ID TEXT NOT NULL,
      Restaurant_ID TEXT NOT NULL,
      Address_ID TEXT NOT NULL,
      Coupon_ID TEXT,
      Order_Date TEXT DEFAULT (datetime('now')),
      Order_Status TEXT DEFAULT 'PLACED',
      Special_Instructions TEXT,
      Delivery_Fee REAL DEFAULT 40.0,
      Tax_Amount REAL DEFAULT 0.0,
      FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID),
      FOREIGN KEY (Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID),
      FOREIGN KEY (Address_ID) REFERENCES ADDRESS(Address_ID),
      FOREIGN KEY (Coupon_ID) REFERENCES COUPON(Coupon_ID)
    );

    -- 13. ORDER_ITEM
    CREATE TABLE IF NOT EXISTS ORDER_ITEM (
      Order_ID TEXT NOT NULL,
      Food_ID TEXT NOT NULL,
      Restaurant_ID TEXT NOT NULL,
      Quantity INTEGER NOT NULL CHECK (Quantity > 0),
      Item_Price REAL NOT NULL CHECK (Item_Price >= 0),
      PRIMARY KEY (Order_ID, Food_ID, Restaurant_ID),
      FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID) ON DELETE CASCADE,
      FOREIGN KEY (Food_ID, Restaurant_ID) REFERENCES FOOD_ITEM(Food_ID, Restaurant_ID)
    );

    -- 14. PAYMENT
    CREATE TABLE IF NOT EXISTS PAYMENT (
      Payment_ID TEXT PRIMARY KEY,
      Order_ID TEXT NOT NULL,
      Payment_Method TEXT NOT NULL,
      Payment_Status TEXT DEFAULT 'COMPLETED',
      Payment_Date TEXT DEFAULT (datetime('now')),
      Amount_Paid REAL NOT NULL CHECK (Amount_Paid >= 0),
      Transaction_Ref TEXT,
      FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID) ON DELETE CASCADE
    );

    -- 15. DELIVERY
    CREATE TABLE IF NOT EXISTS DELIVERY (
      Delivery_ID TEXT PRIMARY KEY,
      Order_ID TEXT UNIQUE NOT NULL,
      Partner_ID TEXT,
      Pickup_Time TEXT,
      Delivery_Time TEXT,
      Delivery_Status TEXT DEFAULT 'ASSIGNED',
      FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID) ON DELETE CASCADE,
      FOREIGN KEY (Partner_ID) REFERENCES DELIVERY_PARTNER(Partner_ID)
    );

    -- 16. REVIEW
    CREATE TABLE IF NOT EXISTS REVIEW (
      Review_ID TEXT PRIMARY KEY,
      Customer_ID TEXT NOT NULL,
      Restaurant_ID TEXT NOT NULL,
      Order_ID TEXT UNIQUE NOT NULL,
      Rating REAL NOT NULL CHECK (Rating >= 1.0 AND Rating <= 5.0),
      Comment_Text TEXT,
      Review_Date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID),
      FOREIGN KEY (Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID),
      FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID)
    );

    -- VIEWS
    CREATE VIEW IF NOT EXISTS VW_RESTAURANT_RATINGS AS
    SELECT 
      r.Restaurant_ID,
      r.Name AS Restaurant_Name,
      r.City,
      ROUND(COALESCE(AVG(rev.Rating), 4.3), 1) AS Avg_Rating,
      COUNT(rev.Review_ID) AS Review_Count
    FROM RESTAURANT r
    LEFT JOIN REVIEW rev ON r.Restaurant_ID = rev.Restaurant_ID
    GROUP BY r.Restaurant_ID, r.Name, r.City;

    CREATE VIEW IF NOT EXISTS VW_ACTIVE_OFFERS AS
    SELECT 
      COALESCE(MAX(Discount_Percentage), 0) AS Max_Discount_Percentage,
      COUNT(Coupon_ID) AS Active_Coupons_Count
    FROM COUPON
    WHERE Is_Active = 1 AND Expiry_Date >= date('now');
  `);

  // Check if seed data already exists
  const count = db.prepare('SELECT COUNT(*) as cnt FROM PERSON').get();
  if (count.cnt === 0) {
    seedData();
  }
}

function seedData() {
  const insertPerson = db.prepare(`
    INSERT INTO PERSON (Person_ID, First_Name, Last_Name, Email, Password, Date_Of_Birth)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertPerson.run('P001', 'Rishi', 'K', 'rishi@example.com', 'demo123', '2002-05-14');
  insertPerson.run('P002', 'Aarav', 'Sharma', 'aarav@example.com', 'demo123', '1998-11-20');
  insertPerson.run('P003', 'Priya', 'Nair', 'priya@example.com', 'demo123', '2000-08-04');
  insertPerson.run('P004', 'Vikram', 'Singh', 'vikram.partner@foodiego.com', 'demo123', '1995-03-12');
  insertPerson.run('P005', 'Rajesh', 'Kumar', 'rajesh.partner@foodiego.com', 'demo123', '1997-09-25');

  const insertPhone = db.prepare('INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES (?, ?)');
  insertPhone.run('P001', '+91 9876543210');
  insertPhone.run('P001', '+91 9123456780');
  insertPhone.run('P002', '+91 9845012345');
  insertPhone.run('P004', '+91 9740112233');
  insertPhone.run('P005', '+91 9611223344');

  const insertCustomer = db.prepare('INSERT INTO CUSTOMER (Customer_ID, Loyalty_Points) VALUES (?, ?)');
  insertCustomer.run('P001', 340);
  insertCustomer.run('P002', 150);
  insertCustomer.run('P003', 75);

  const insertPartner = db.prepare('INSERT INTO DELIVERY_PARTNER (Partner_ID, Vehicle_Type, License_Number, Availability_Status) VALUES (?, ?, ?, ?)');
  insertPartner.run('P004', 'BIKE', 'KA-01-AB-1234', 'AVAILABLE');
  insertPartner.run('P005', 'ELECTRIC_VEHICLE', 'KA-03-EV-5678', 'AVAILABLE');

  const insertRestaurant = db.prepare(`
    INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  insertRestaurant.run('R001', 'Meghana Foods (Flagship)', '100 Feet Road, Indiranagar', 'Bangalore', 'Karnataka', '560038', null, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80');
  insertRestaurant.run('R002', 'Meghana Foods (Koramangala Branch)', 'Koramangala 5th Block', 'Bangalore', 'Karnataka', '560095', 'R001', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80');
  insertRestaurant.run('R003', 'Truffles Gourmet Bistro', 'St. Marks Road', 'Bangalore', 'Karnataka', '560001', null, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80');
  insertRestaurant.run('R004', 'CTR - Shri Sagar Dosa', '7th Cross, Margosa Road, Malleshwaram', 'Bangalore', 'Karnataka', '560003', null, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=80');
  insertRestaurant.run('R005', "Leon's Burgers & Wings", 'CMH Road, Indiranagar', 'Bangalore', 'Karnataka', '560038', null, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80');
  insertRestaurant.run('R006', 'Empire Restaurant (Church Street)', 'Church Street, Shanthala Nagar', 'Bangalore', 'Karnataka', '560001', null, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80');
  insertRestaurant.run('R007', 'Brik Oven Artisanal Pizza', 'Palace Road, Vasanth Nagar', 'Bangalore', 'Karnataka', '560052', null, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80');
  insertRestaurant.run('R008', 'Mainland China Gourmet', 'HAL 2nd Stage, Indiranagar', 'Bangalore', 'Karnataka', '560038', null, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80');
  
  // Chennai Restaurants
  insertRestaurant.run('R009', 'Murugan Idli Shop', 'G.N. Chetty Road, T. Nagar', 'Chennai', 'Tamil Nadu', '600017', null, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80');
  insertRestaurant.run('R010', 'Dindigul Thalappakatti (Flagship)', 'Nungambakkam High Road', 'Chennai', 'Tamil Nadu', '600034', null, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80');
  insertRestaurant.run('R011', 'Anjappar Chettinad Restaurant', '2nd Avenue, Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', null, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&q=80');
  insertRestaurant.run('R012', 'Sangeetha Veg Restaurant', 'Luz Church Road, Mylapore', 'Chennai', 'Tamil Nadu', '600004', null, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80');

  const insertCuisine = db.prepare('INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES (?, ?)');
  insertCuisine.run('R001', 'Biryani');
  insertCuisine.run('R001', 'North Indian');
  insertCuisine.run('R002', 'Biryani');
  insertCuisine.run('R002', 'South Indian');
  insertCuisine.run('R003', 'Burgers');
  insertCuisine.run('R003', 'Desserts');
  insertCuisine.run('R003', 'Pasta');
  insertCuisine.run('R004', 'South Indian');
  insertCuisine.run('R004', 'Dosa');
  insertCuisine.run('R005', 'Burgers');
  insertCuisine.run('R005', 'Rolls');
  insertCuisine.run('R006', 'North Indian');
  insertCuisine.run('R006', 'Parotta');
  insertCuisine.run('R006', 'Biryani');
  insertCuisine.run('R007', 'Pizza');
  insertCuisine.run('R007', 'Desserts');
  insertCuisine.run('R008', 'Chinese');
  insertCuisine.run('R008', 'Noodles');

  // Chennai Cuisines
  insertCuisine.run('R009', 'South Indian');
  insertCuisine.run('R009', 'Dosa');
  insertCuisine.run('R010', 'Biryani');
  insertCuisine.run('R010', 'South Indian');
  insertCuisine.run('R010', 'Parotta');
  insertCuisine.run('R011', 'South Indian');
  insertCuisine.run('R011', 'Biryani');
  insertCuisine.run('R011', 'Rolls');
  insertCuisine.run('R012', 'South Indian');
  insertCuisine.run('R012', 'North Indian');
  insertCuisine.run('R012', 'Desserts');

  const insertCat = db.prepare('INSERT INTO FOOD_CATEGORY (Category_ID, Category_Name, Description) VALUES (?, ?, ?)');
  insertCat.run('CAT01', 'Biryani Specials', 'Aromatic basmati rice cooked with authentic rich spices');
  insertCat.run('CAT02', 'South Indian Delights', 'Crispy dosas, fluffy idlis, and traditional chutneys');
  insertCat.run('CAT03', 'Burgers & Wraps', 'Gourmet handcrafted burgers and savory grilled wraps');
  insertCat.run('CAT04', 'Pizzas & Pastas', 'Wood-fired sourdough pizzas and creamy handmade pastas');
  insertCat.run('CAT05', 'Chinese Wok & Bowls', 'Flavorful stir fries, noodles, and dim sums');
  insertCat.run('CAT06', 'Desserts & Shakes', 'Indulgent cakes, ice creams, and beverages');

  const insertItem = db.prepare(`
    INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  // Meghana Foods
  insertItem.run('F001', 'R001', 'Meghana Special Chicken Biryani', 'Slow-cooked spiced boneless chicken layered over flavorful aromatic basmati rice.', 340.00, 'CAT01', 0, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80');
  insertItem.run('F002', 'R001', 'Paneer Hyderabadi Biryani', 'Fresh cottage cheese cubes simmered in royal herbs and fragrant saffron rice.', 290.00, 'CAT01', 1, 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500&q=80');
  insertItem.run('F003', 'R001', 'Chicken 65 Andhra Style', 'Deep-fried spicy chicken bites marinated with fiery red chilies and curry leaves.', 260.00, 'CAT01', 0, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&q=80');
  insertItem.run('F004', 'R001', 'Butter Naan & Dal Makhani Combo', 'Slow-cooked black lentils in rich butter gravy served with hot tandoori naan.', 240.00, 'CAT01', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80');

  // CTR Dosa
  insertItem.run('F005', 'R004', 'Benne Masala Dosa', 'Legendary golden-crisp crepe roasted in pure white butter, stuffed with spiced potato masala.', 110.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=80');
  insertItem.run('F006', 'R004', 'Medu Vada (2 pcs)', 'Crispy golden fried lentil donuts served with coconut chutney and tangy piping sambar.', 75.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80');
  insertItem.run('F007', 'R004', 'Kesari Bath & Filter Coffee', 'Traditional saffron semolina halwa accompanied by rich authentic South Indian filter kaapi.', 95.00, 'CAT06', 1, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80');

  // Truffles
  insertItem.run('F008', 'R003', 'All American Cheese Burger', 'Juicy grilled patty topped with melted cheddar, gherkins, caramelized onions, and house aioli.', 280.00, 'CAT03', 0, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80');
  insertItem.run('F009', 'R003', 'Creamy Alfredo Penne Pasta', 'Tender penne pasta tossed in rich garlic parmesan cream sauce with wild mushrooms.', 260.00, 'CAT04', 1, 'https://images.unsplash.com/photo-1621996346565-e3d5d6281728?w=500&q=80');
  insertItem.run('F010', 'R003', 'Dutch Truffle Pastry', 'Decadent dark chocolate sponge cake layered with silky Belgian chocolate ganache.', 175.00, 'CAT06', 1, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80');

  // Brik Oven
  insertItem.run('F011', 'R007', 'Margherita DOC Wood-Fired Pizza', 'San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.', 480.00, 'CAT04', 1, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80');
  insertItem.run('F012', 'R007', 'Smoked Chicken & Jalapeno Pizza', 'Wood-roasted shredded chicken, pickled jalapenos, mozzarella, and spicy hot honey drizzle.', 560.00, 'CAT04', 0, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80');

  // Mainland China
  insertItem.run('F013', 'R008', 'Hakka Chili Garlic Noodles', 'Wok-tossed egg noodles with bell peppers, spring onion, fresh garlic, and spicy soy chili.', 270.00, 'CAT05', 1, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80');
  insertItem.run('F014', 'R008', 'Crispy Schezwan Veg Spring Rolls', 'Golden fried flaky pastry sheets filled with spiced crunchy vegetables and sweet chili dip.', 210.00, 'CAT05', 1, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80');

  // Chennai Items (Murugan Idli, Thalappakatti, Anjappar, Sangeetha)
  insertItem.run('F015', 'R009', 'Ghee Podi Idli (4 pcs)', 'Steaming hot mini idlis tossed in aromatic spiced gunpowder podi and pure ghee.', 120.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80');
  insertItem.run('F016', 'R009', 'Special Ghee Roast Dosa', 'Golden paper-thin crispy roast prepared with pure melted cow ghee and trio chutneys.', 140.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=80');

  insertItem.run('F017', 'R010', 'Thalappakatti Mutton Biryani', 'Legendary Seeraga Samba rice cooked with tender farm mutton and Chettinad spices.', 360.00, 'CAT01', 0, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80');
  insertItem.run('F018', 'R010', 'Chicken Chukka with Ceylon Parotta', 'Fiery pan-roasted dry chicken cooked with shallots, black pepper, and flaky parotta.', 290.00, 'CAT01', 0, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&q=80');

  insertItem.run('F019', 'R011', 'Chettinad Pepper Chicken Fry', 'Deeply roasted tender chicken coated with roasted cumin, fennel, and crushed black pepper.', 280.00, 'CAT01', 0, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&q=80');
  insertItem.run('F020', 'R011', 'Coin Parotta & Veg Kurma Combo', 'Multi-layered crispy coin parottas served with rich coconut veg kurma.', 110.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80');

  insertItem.run('F021', 'R012', 'South Indian Special Meals', 'Traditional Tamil Nadu thali with rice, sambar, rasam, kootu, poriyal, appalam & payasam.', 190.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80');
  insertItem.run('F022', 'R012', 'Mysore Masala Dosa', 'Crispy fermented crepe smeared with spicy red chili garlic chutney & potato filling.', 130.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=80');

  const insertIngredient = db.prepare('INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES (?, ?, ?)');
  insertIngredient.run('F015', 'R009', 'Idli Rice Batter');
  insertIngredient.run('F015', 'R009', 'Gunpowder Milagai Podi');
  insertIngredient.run('F015', 'R009', 'Pure Desi Ghee');

  insertIngredient.run('F016', 'R009', 'Fermented Rice Batter');
  insertIngredient.run('F016', 'R009', 'Pure Ghee');
  insertIngredient.run('F016', 'R009', 'Coconut Chutney Trio');

  insertIngredient.run('F017', 'R010', 'Seeraga Samba Fragrant Rice');
  insertIngredient.run('F017', 'R010', 'Tender Grass-Fed Mutton');
  insertIngredient.run('F017', 'R010', 'Chettinad Masala & Ghee');

  insertIngredient.run('F018', 'R010', 'Country Chicken');
  insertIngredient.run('F018', 'R010', 'Black Peppercorns');
  insertIngredient.run('F018', 'R010', 'Layered Ceylon Parotta');

  insertIngredient.run('F019', 'R011', 'Fresh Farm Chicken');
  insertIngredient.run('F019', 'R011', 'Crushed Black Pepper & Fennel');
  insertIngredient.run('F019', 'R011', 'Curry Leaves');

  insertIngredient.run('F020', 'R011', 'Layered Coin Parotta');
  insertIngredient.run('F020', 'R011', 'Coconut Milk & Spices');

  insertIngredient.run('F021', 'R012', 'Ponni Boiled Rice');
  insertIngredient.run('F021', 'R012', 'Tamarind Rasam');
  insertIngredient.run('F021', 'R012', 'Vegetable Sambar');

  insertIngredient.run('F022', 'R012', 'Crispy Dosa Batter');
  insertIngredient.run('F022', 'R012', 'Spicy Mysore Red Paste');
  insertIngredient.run('F022', 'R012', 'Potato Onion Masala');
  insertIngredient.run('F001', 'R001', 'Basmati Rice');
  insertIngredient.run('F001', 'R001', 'Farm Fresh Chicken');
  insertIngredient.run('F001', 'R001', 'Saffron & Mint Leaves');
  insertIngredient.run('F001', 'R001', 'Pure Ghee & Whole Spices');

  insertIngredient.run('F002', 'R001', 'Malai Paneer');
  insertIngredient.run('F002', 'R001', 'Basmati Rice');
  insertIngredient.run('F002', 'R001', 'Biryani Spices');

  insertIngredient.run('F003', 'R001', 'Boneless Chicken Bites');
  insertIngredient.run('F003', 'R001', 'Curry Leaves');
  insertIngredient.run('F003', 'R001', 'Guntur Red Chillies');

  insertIngredient.run('F004', 'R001', 'Black Urad Dal');
  insertIngredient.run('F004', 'R001', 'Amul Butter');
  insertIngredient.run('F004', 'R001', 'Tandoori Naan Wheat');

  insertIngredient.run('F005', 'R004', 'Fermented Rice & Urad Batter');
  insertIngredient.run('F005', 'R004', 'White Benne Butter');
  insertIngredient.run('F005', 'R004', 'Spiced Potato Onion Masala');
  insertIngredient.run('F005', 'R004', 'Red Garlic Chutney');

  insertIngredient.run('F006', 'R004', 'Urad Dal Paste');
  insertIngredient.run('F006', 'R004', 'Curry Leaves & Black Pepper');
  insertIngredient.run('F006', 'R004', 'Coconut Chutney');

  insertIngredient.run('F007', 'R004', 'Roasted Semolina');
  insertIngredient.run('F007', 'R004', 'Kashmir Saffron');
  insertIngredient.run('F007', 'R004', 'Filter Coffee Beans');

  insertIngredient.run('F008', 'R003', 'Toasted Brioche Bun');
  insertIngredient.run('F008', 'R003', 'Prime Tender Patty');
  insertIngredient.run('F008', 'R003', 'Aged Cheddar Cheese');
  insertIngredient.run('F008', 'R003', 'Caramelized Onions');

  insertIngredient.run('F009', 'R003', 'Durum Wheat Penne');
  insertIngredient.run('F009', 'R003', 'Heavy Cream & Garlic');
  insertIngredient.run('F009', 'R003', 'Parmesan Cheese');

  insertIngredient.run('F010', 'R003', 'Belgian Dark Chocolate Ganache');
  insertIngredient.run('F010', 'R003', 'Cocoa Sponge Layer');

  insertIngredient.run('F011', 'R007', 'Italian 00 Sourdough Crust');
  insertIngredient.run('F011', 'R007', 'San Marzano Crushed Tomato');
  insertIngredient.run('F011', 'R007', 'Fresh Buffalo Mozzarella');
  insertIngredient.run('F011', 'R007', 'Organic Sweet Basil');

  insertIngredient.run('F012', 'R007', 'Smoked Chicken Chunks');
  insertIngredient.run('F012', 'R007', 'Pickled Jalapenos');
  insertIngredient.run('F012', 'R007', 'Hot Honey Glaze');

  insertIngredient.run('F013', 'R008', 'Egg Wheat Noodles');
  insertIngredient.run('F013', 'R008', 'Minced Garlic & Spring Onion');
  insertIngredient.run('F013', 'R008', 'Dark Soy Sauce & Red Chili');

  insertIngredient.run('F014', 'R008', 'Crispy Pastry Sheet');
  insertIngredient.run('F014', 'R008', 'Julienned Cabbage & Carrot');
  insertIngredient.run('F014', 'R008', 'Schezwan Dip');

  const insertAddress = db.prepare(`
    INSERT INTO ADDRESS (Address_ID, Customer_ID, Street, City, State, Postal_Code, Address_Type, Is_Default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAddress.run('A001', 'P001', 'Flat 402, Sunshine Heights, 12th Main, Indiranagar', 'Bangalore', 'Karnataka', '560038', 'HOME', 1);
  insertAddress.run('A002', 'P001', 'Tech Park Tower 3, 5th Floor, Whitefield', 'Bangalore', 'Karnataka', '560066', 'WORK', 0);

  const insertCoupon = db.prepare(`
    INSERT INTO COUPON (Coupon_ID, Code, Discount_Percentage, Min_Order_Amount, Max_Discount_Amount, Expiry_Date, Is_Active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  // Top active discounts: 60% and 50%
  insertCoupon.run('CP01', 'SUPER60', 60.00, 200.00, 150.00, '2026-12-31', 1);
  insertCoupon.run('CP02', 'DINEOUT50', 50.00, 300.00, 200.00, '2026-12-31', 1);
  insertCoupon.run('CP03', 'WELCOME50', 50.00, 150.00, 100.00, '2026-12-31', 1);
  insertCoupon.run('CP04', 'FOODIE20', 20.00, 100.00, 75.00, '2026-12-31', 1);

  // Past Orders
  const insertOrder = db.prepare(`
    INSERT INTO ORDERS (Order_ID, Customer_ID, Restaurant_ID, Address_ID, Coupon_ID, Order_Date, Order_Status, Special_Instructions, Delivery_Fee, Tax_Amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run('ORD101', 'P001', 'R001', 'A001', 'CP03', '2026-09-10 19:30:00', 'DELIVERED', 'Extra salan and gravy please.', 40.0, 25.5);
  insertOrder.run('ORD102', 'P001', 'R004', 'A001', null, '2026-09-11 08:45:00', 'DELIVERED', 'Hot sambar please.', 30.0, 12.0);

  const insertOrderItem = db.prepare('INSERT INTO ORDER_ITEM (Order_ID, Food_ID, Restaurant_ID, Quantity, Item_Price) VALUES (?, ?, ?, ?, ?)');
  insertOrderItem.run('ORD101', 'F001', 'R001', 2, 340.0);
  insertOrderItem.run('ORD101', 'F003', 'R001', 1, 260.0);
  insertOrderItem.run('ORD102', 'F005', 'R004', 2, 110.0);
  insertOrderItem.run('ORD102', 'F006', 'R004', 1, 75.0);

  const insertPayment = db.prepare(`
    INSERT INTO PAYMENT (Payment_ID, Order_ID, Payment_Method, Payment_Status, Payment_Date, Amount_Paid, Transaction_Ref)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertPayment.run('PAY101', 'ORD101', 'UPI', 'COMPLETED', '2026-09-10 19:31:10', 865.5, 'UPI-REF-9847120934');
  insertPayment.run('PAY102', 'ORD102', 'CREDIT_CARD', 'COMPLETED', '2026-09-11 08:46:02', 337.0, 'CC-REF-4491029482');

  const insertDelivery = db.prepare(`
    INSERT INTO DELIVERY (Delivery_ID, Order_ID, Partner_ID, Pickup_Time, Delivery_Time, Delivery_Status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertDelivery.run('DEL101', 'ORD101', 'P004', '2026-09-10 19:48:00', '2026-09-10 20:12:00', 'DELIVERED');
  insertDelivery.run('DEL102', 'ORD102', 'P005', '2026-09-11 09:00:00', '2026-09-11 09:24:00', 'DELIVERED');

  const insertReview = db.prepare(`
    INSERT INTO REVIEW (Review_ID, Customer_ID, Restaurant_ID, Order_ID, Rating, Comment_Text, Review_Date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertReview.run('REV101', 'P001', 'R001', 'ORD101', 4.8, 'Outstanding authentic biryani! Tender chicken and supreme aroma.', '2026-09-10 20:45:00');
  insertReview.run('REV102', 'P001', 'R004', 'ORD102', 4.9, 'CTR Benne Dosa never disappoints! Crispy, buttery perfection.', '2026-09-11 10:15:00');
}
