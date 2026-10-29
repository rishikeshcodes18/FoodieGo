-- ============================================================================
-- ONLINE FOOD DELIVERY SYSTEM (OFDS) - "FoodieGo"
-- Comprehensive Seed Data Script (Oracle SQL Compatible)
-- ============================================================================
SET DEFINE OFF;

-- 1. PERSON (Supertype)
INSERT INTO PERSON (Person_ID, First_Name, Last_Name, Email, Password, Date_Of_Birth) VALUES 
('P001', 'Rishi', 'K', 'rishi@example.com', '$2a$10$hashedpass1234567890', TO_DATE('2002-05-14', 'YYYY-MM-DD'));
INSERT INTO PERSON (Person_ID, First_Name, Last_Name, Email, Password, Date_Of_Birth) VALUES 
('P002', 'Aarav', 'Sharma', 'aarav.sharma@example.com', '$2a$10$hashedpass1234567890', TO_DATE('1998-11-20', 'YYYY-MM-DD'));
INSERT INTO PERSON (Person_ID, First_Name, Last_Name, Email, Password, Date_Of_Birth) VALUES 
('P003', 'Priya', 'Nair', 'priya.nair@example.com', '$2a$10$hashedpass1234567890', TO_DATE('2000-08-04', 'YYYY-MM-DD'));
INSERT INTO PERSON (Person_ID, First_Name, Last_Name, Email, Password, Date_Of_Birth) VALUES 
('P004', 'Vikram', 'Singh', 'vikram.partner@foodiego.com', '$2a$10$hashedpass1234567890', TO_DATE('1995-03-12', 'YYYY-MM-DD'));
INSERT INTO PERSON (Person_ID, First_Name, Last_Name, Email, Password, Date_Of_Birth) VALUES 
('P005', 'Rajesh', 'Kumar', 'rajesh.partner@foodiego.com', '$2a$10$hashedpass1234567890', TO_DATE('1997-09-25', 'YYYY-MM-DD'));
INSERT INTO PERSON (Person_ID, First_Name, Last_Name, Email, Password, Date_Of_Birth) VALUES 
('P006', 'Sneha', 'Reddy', 'sneha.reddy@example.com', '$2a$10$hashedpass1234567890', TO_DATE('2001-01-30', 'YYYY-MM-DD'));

-- 2. PERSON_PHONE (Multivalued attribute)
INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES ('P001', '+91 9876543210');
INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES ('P001', '+91 9123456780');
INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES ('P002', '+91 9845012345');
INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES ('P003', '+91 9980123456');
INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES ('P004', '+91 9740112233');
INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES ('P005', '+91 9611223344');
INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES ('P006', '+91 9535667788');

-- 3. CUSTOMER (Subtype)
INSERT INTO CUSTOMER (Customer_ID, Loyalty_Points) VALUES ('P001', 340);
INSERT INTO CUSTOMER (Customer_ID, Loyalty_Points) VALUES ('P002', 150);
INSERT INTO CUSTOMER (Customer_ID, Loyalty_Points) VALUES ('P003', 75);
INSERT INTO CUSTOMER (Customer_ID, Loyalty_Points) VALUES ('P006', 220);

-- 4. DELIVERY_PARTNER (Subtype)
INSERT INTO DELIVERY_PARTNER (Partner_ID, Vehicle_Type, License_Number, Availability_Status) VALUES 
('P004', 'BIKE', 'KA-01-AB-1234', 'AVAILABLE');
INSERT INTO DELIVERY_PARTNER (Partner_ID, Vehicle_Type, License_Number, Availability_Status) VALUES 
('P005', 'ELECTRIC_VEHICLE', 'KA-03-EV-5678', 'AVAILABLE');

-- 5. RESTAURANT (Includes Parent-Branch recursive relationship)
INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R001', 'Meghana Foods (Flagship)', '100 Feet Road, Indiranagar', 'Bangalore', 'Karnataka', '560038', NULL, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R002', 'Meghana Foods (Koramangala Branch)', 'Koramangala 5th Block', 'Bangalore', 'Karnataka', '560095', 'R001', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R003', 'Truffles Burger & Bistro', 'St. Marks Road', 'Bangalore', 'Karnataka', '560001', NULL, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R004', 'CTR - Shri Sagar Dosa', '7th Cross, Margosa Road, Malleshwaram', 'Bangalore', 'Karnataka', '560003', NULL, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R005', 'Leon''s Burgers & Wings', 'CMH Road, Indiranagar', 'Bangalore', 'Karnataka', '560038', NULL, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R006', 'Empire Restaurant (Church Street)', 'Church Street, Shanthala Nagar', 'Bangalore', 'Karnataka', '560001', NULL, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R007', 'Brik Oven Artisanal Pizza', 'Palace Road, Vasanth Nagar', 'Bangalore', 'Karnataka', '560052', NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R008', 'Mainland China Gourmet', 'HAL 2nd Stage, Indiranagar', 'Bangalore', 'Karnataka', '560038', NULL, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80', 1);

-- Chennai Restaurants
INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R009', 'Murugan Idli Shop', 'G.N. Chetty Road, T. Nagar', 'Chennai', 'Tamil Nadu', '600017', NULL, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R010', 'Dindigul Thalappakatti (Flagship)', 'Nungambakkam High Road', 'Chennai', 'Tamil Nadu', '600034', NULL, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R011', 'Anjappar Chettinad Restaurant', '2nd Avenue, Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', NULL, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&q=80', 1);

INSERT INTO RESTAURANT (Restaurant_ID, Name, Street, City, State, Postal_Code, Parent_Restaurant_ID, Image_URL, Is_Active) VALUES 
('R012', 'Sangeetha Veg Restaurant', 'Luz Church Road, Mylapore', 'Chennai', 'Tamil Nadu', '600004', NULL, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80', 1);

-- 6. RESTAURANT_CUISINE (Multivalued attribute)
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R001', 'Biryani');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R001', 'Andhra');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R001', 'North Indian');

INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R002', 'Biryani');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R002', 'South Indian');

INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R003', 'Burgers');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R003', 'Desserts');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R003', 'Pasta');

INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R004', 'South Indian');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R004', 'Dosa');

INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R005', 'Burgers');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R005', 'Rolls');

INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R006', 'North Indian');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R006', 'Parotta');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R006', 'Biryani');

INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R007', 'Pizza');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R007', 'Desserts');

INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R008', 'Chinese');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R008', 'Noodles');

-- Chennai Cuisines
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R009', 'South Indian');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R009', 'Dosa');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R010', 'Biryani');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R010', 'South Indian');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R010', 'Parotta');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R011', 'South Indian');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R011', 'Biryani');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R011', 'Rolls');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R012', 'South Indian');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R012', 'North Indian');
INSERT INTO RESTAURANT_CUISINE (Restaurant_ID, Cuisine_Type) VALUES ('R012', 'Desserts');

-- 7. FOOD_CATEGORY
INSERT INTO FOOD_CATEGORY (Category_ID, Category_Name, Description) VALUES 
('CAT01', 'Biryani Specials', 'Aromatic basmati rice cooked with authentic rich spices');
INSERT INTO FOOD_CATEGORY (Category_ID, Category_Name, Description) VALUES 
('CAT02', 'South Indian Delights', 'Crispy dosas, fluffy idlis, and traditional chutneys');
INSERT INTO FOOD_CATEGORY (Category_ID, Category_Name, Description) VALUES 
('CAT03', 'Burgers & Wraps', 'Gourmet handcrafted burgers and savory grilled wraps');
INSERT INTO FOOD_CATEGORY (Category_ID, Category_Name, Description) VALUES 
('CAT04', 'Pizzas & Pastas', 'Wood-fired sourdough pizzas and creamy handmade pastas');
INSERT INTO FOOD_CATEGORY (Category_ID, Category_Name, Description) VALUES 
('CAT05', 'Chinese Wok & Bowls', 'Flavorful stir fries, noodles, and dim sums');
INSERT INTO FOOD_CATEGORY (Category_ID, Category_Name, Description) VALUES 
('CAT06', 'Desserts & Shakes', 'Indulgent cakes, ice creams, and beverages');

-- 8. FOOD_ITEM (Composite PK: Food_ID, Restaurant_ID)
-- Meghana Foods (R001)
INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F001', 'R001', 'Meghana Special Chicken Biryani', 'Slow-cooked spiced boneless chicken layered over flavorful aromatic basmati rice.', 340.00, 'CAT01', 0, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F002', 'R001', 'Paneer Hyderabadi Biryani', 'Fresh cottage cheese cubes simmered in royal herbs and fragrant saffron rice.', 290.00, 'CAT01', 1, 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F003', 'R001', 'Chicken 65 Andhra Style', 'Deep-fried spicy chicken bites marinated with fiery red chilies and curry leaves.', 260.00, 'CAT01', 0, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F004', 'R001', 'Butter Naan & Dal Makhani Combo', 'Slow-cooked black lentils in rich butter gravy served with hot tandoori naan.', 240.00, 'CAT01', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', 1);

-- CTR Shri Sagar (R004)
INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F005', 'R004', 'Benne Masala Dosa', 'Legendary golden-crisp crepe roasted in pure white butter, stuffed with spiced potato masala.', 110.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F006', 'R004', 'Medu Vada (2 pcs)', 'Crispy golden fried lentil donuts served with coconut chutney and tangy piping sambar.', 75.00, 'CAT02', 1, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F007', 'R004', 'Kesari Bath & Filter Coffee', 'Traditional saffron semolina halwa accompanied by rich authentic South Indian filter kaapi.', 95.00, 'CAT06', 1, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80', 1);

-- Truffles (R003)
INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F008', 'R003', 'All American Cheese Burger', 'Juicy grilled patty topped with melted cheddar, gherkins, caramelized onions, and house aioli.', 280.00, 'CAT03', 0, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F009', 'R003', 'Creamy Alfredo Penne Pasta', 'Tender penne pasta tossed in rich garlic parmesan cream sauce with wild mushrooms.', 260.00, 'CAT04', 1, 'https://images.unsplash.com/photo-1621996346565-e3d5d6281728?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F010', 'R003', 'Dutch Truffle Pastry', 'Decadent dark chocolate sponge cake layered with silky Belgian chocolate ganache.', 175.00, 'CAT06', 1, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80', 1);

-- Brik Oven (R007)
INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F011', 'R007', 'Margherita DOC Wood-Fired Pizza', 'San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.', 480.00, 'CAT04', 1, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F012', 'R007', 'Smoked Chicken & Jalapeno Pizza', 'Wood-roasted shredded chicken, pickled jalapenos, mozzarella, and spicy hot honey drizzle.', 560.00, 'CAT04', 0, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80', 1);

-- Mainland China (R008)
INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F013', 'R008', 'Hakka Chili Garlic Noodles', 'Wok-tossed egg noodles with bell peppers, spring onion, fresh garlic, and spicy soy chili.', 270.00, 'CAT05', 1, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80', 1);

INSERT INTO FOOD_ITEM (Food_ID, Restaurant_ID, Name, Description, Price, Category_ID, Is_Veg, Image_URL, Is_Available) VALUES 
('F014', 'R008', 'Crispy Schezwan Veg Spring Rolls', 'Golden fried flaky pastry sheets filled with spiced crunchy vegetables and sweet chili dip.', 210.00, 'CAT05', 1, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', 1);

-- 9. FOOD_INGREDIENT (Multivalued attribute for Food_Item)
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F001', 'R001', 'Basmati Rice');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F001', 'R001', 'Farm Fresh Chicken');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F001', 'R001', 'Saffron & Mint');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F001', 'R001', 'Ghee & Spices');

INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F005', 'R004', 'Fermented Rice Batter');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F005', 'R004', 'Pure Butter (Benne)');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F005', 'R004', 'Mashed Spiced Potatoes');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F005', 'R004', 'Red Garlic Chutney');

INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F008', 'R003', 'Brioche Bun');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F008', 'R003', 'Prime Patty');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F008', 'R003', 'Cheddar Cheese');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F008', 'R003', 'Caramelized Onions');

INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F011', 'R007', 'Italian 00 Flour');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F011', 'R007', 'San Marzano Tomato');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F011', 'R007', 'Buffalo Mozzarella');
INSERT INTO FOOD_INGREDIENT (Food_ID, Restaurant_ID, Ingredient_Name) VALUES ('F011', 'R007', 'Fresh Basil');

-- 10. ADDRESS (Customer Addresses)
INSERT INTO ADDRESS (Address_ID, Customer_ID, Street, City, State, Postal_Code, Address_Type, Is_Default) VALUES 
('A001', 'P001', 'Flat 402, Sunshine Heights, 12th Main, Indiranagar', 'Bangalore', 'Karnataka', '560038', 'HOME', 1);
INSERT INTO ADDRESS (Address_ID, Customer_ID, Street, City, State, Postal_Code, Address_Type, Is_Default) VALUES 
('A002', 'P001', 'Tech Park Tower 3, 5th Floor, Whitefield', 'Bangalore', 'Karnataka', '560066', 'WORK', 0);
INSERT INTO ADDRESS (Address_ID, Customer_ID, Street, City, State, Postal_Code, Address_Type, Is_Default) VALUES 
('A003', 'P002', 'Villa 18, Palm Meadows, Ramagondanahalli', 'Bangalore', 'Karnataka', '560066', 'HOME', 1);
INSERT INTO ADDRESS (Address_ID, Customer_ID, Street, City, State, Postal_Code, Address_Type, Is_Default) VALUES 
('A004', 'P003', '24, 4th Cross, Koramangala 4th Block', 'Bangalore', 'Karnataka', '560034', 'HOME', 1);

-- 11. COUPON (Including active top discounts: 60% and 50%)
INSERT INTO COUPON (Coupon_ID, Code, Discount_Percentage, Min_Order_Amount, Max_Discount_Amount, Expiry_Date, Is_Active) VALUES 
('CP01', 'SUPER60', 60.00, 200.00, 150.00, TO_DATE('2026-12-31', 'YYYY-MM-DD'), 1);

INSERT INTO COUPON (Coupon_ID, Code, Discount_Percentage, Min_Order_Amount, Max_Discount_Amount, Expiry_Date, Is_Active) VALUES 
('CP02', 'DINEOUT50', 50.00, 300.00, 200.00, TO_DATE('2026-12-31', 'YYYY-MM-DD'), 1);

INSERT INTO COUPON (Coupon_ID, Code, Discount_Percentage, Min_Order_Amount, Max_Discount_Amount, Expiry_Date, Is_Active) VALUES 
('CP03', 'WELCOME50', 50.00, 150.00, 100.00, TO_DATE('2026-12-31', 'YYYY-MM-DD'), 1);

INSERT INTO COUPON (Coupon_ID, Code, Discount_Percentage, Min_Order_Amount, Max_Discount_Amount, Expiry_Date, Is_Active) VALUES 
('CP04', 'FOODIE20', 20.00, 100.00, 75.00, TO_DATE('2026-12-31', 'YYYY-MM-DD'), 1);

-- 12. ORDERS (Past Orders for Demo)
INSERT INTO ORDERS (Order_ID, Customer_ID, Restaurant_ID, Address_ID, Coupon_ID, Order_Date, Order_Status, Special_Instructions, Delivery_Fee, Tax_Amount) VALUES 
('ORD101', 'P001', 'R001', 'A001', 'CP03', TIMESTAMP '2026-09-10 19:30:00', 'DELIVERED', 'Please pack extra salan and spicy gravy.', 40.00, 25.50);

INSERT INTO ORDERS (Order_ID, Customer_ID, Restaurant_ID, Address_ID, Coupon_ID, Order_Date, Order_Status, Special_Instructions, Delivery_Fee, Tax_Amount) VALUES 
('ORD102', 'P001', 'R004', 'A001', NULL, TIMESTAMP '2026-09-11 08:45:00', 'DELIVERED', 'Hot sambar please, keep chutney separate.', 30.00, 12.00);

-- 13. ORDER_ITEM
INSERT INTO ORDER_ITEM (Order_ID, Food_ID, Restaurant_ID, Quantity, Item_Price) VALUES 
('ORD101', 'F001', 'R001', 2, 340.00);
INSERT INTO ORDER_ITEM (Order_ID, Food_ID, Restaurant_ID, Quantity, Item_Price) VALUES 
('ORD101', 'F003', 'R001', 1, 260.00);

INSERT INTO ORDER_ITEM (Order_ID, Food_ID, Restaurant_ID, Quantity, Item_Price) VALUES 
('ORD102', 'F005', 'R004', 2, 110.00);
INSERT INTO ORDER_ITEM (Order_ID, Food_ID, Restaurant_ID, Quantity, Item_Price) VALUES 
('ORD102', 'F006', 'R004', 1, 75.00);

-- 14. PAYMENT
INSERT INTO PAYMENT (Payment_ID, Order_ID, Payment_Method, Payment_Status, Payment_Date, Amount_Paid, Transaction_Ref) VALUES 
('PAY101', 'ORD101', 'UPI', 'COMPLETED', TIMESTAMP '2026-09-10 19:31:10', 865.50, 'UPI-REF-9847120934');

INSERT INTO PAYMENT (Payment_ID, Order_ID, Payment_Method, Payment_Status, Payment_Date, Amount_Paid, Transaction_Ref) VALUES 
('PAY102', 'ORD102', 'CREDIT_CARD', 'COMPLETED', TIMESTAMP '2026-09-11 08:46:02', 337.00, 'CC-REF-4491029482');

-- 15. DELIVERY
INSERT INTO DELIVERY (Delivery_ID, Order_ID, Partner_ID, Pickup_Time, Delivery_Time, Delivery_Status) VALUES 
('DEL101', 'ORD101', 'P004', TIMESTAMP '2026-09-10 19:48:00', TIMESTAMP '2026-09-10 20:12:00', 'DELIVERED');

INSERT INTO DELIVERY (Delivery_ID, Order_ID, Partner_ID, Pickup_Time, Delivery_Time, Delivery_Status) VALUES 
('DEL102', 'ORD102', 'P005', TIMESTAMP '2026-09-11 09:00:00', TIMESTAMP '2026-09-11 09:24:00', 'DELIVERED');

-- 16. REVIEW
INSERT INTO REVIEW (Review_ID, Customer_ID, Restaurant_ID, Order_ID, Rating, Comment_Text, Review_Date) VALUES 
('REV101', 'P001', 'R001', 'ORD101', 4.8, 'Outstanding authentic biryani! The chicken was extremely tender and spiced to perfection.', TIMESTAMP '2026-09-10 20:45:00');

INSERT INTO REVIEW (Review_ID, Customer_ID, Restaurant_ID, Order_ID, Rating, Comment_Text, Review_Date) VALUES 
('REV102', 'P001', 'R004', 'ORD102', 4.9, 'CTR Benne Dosa never disappoints. Crispy, golden, piping hot with fresh coconut chutney.', TIMESTAMP '2026-09-11 10:15:00');

COMMIT;
