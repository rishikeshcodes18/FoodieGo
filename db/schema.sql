-- ============================================================================
-- ONLINE FOOD DELIVERY SYSTEM (OFDS) - "FoodieGo"
-- Relational Database Management System - Oracle SQL DDL
-- 16 Relations in Third Normal Form (3NF)
-- ============================================================================

-- Drop existing views and tables if they exist
BEGIN
   FOR v IN (SELECT view_name FROM user_views WHERE view_name IN ('VW_RESTAURANT_RATINGS', 'VW_ORDER_SUMMARY', 'VW_CUSTOMER_AGE', 'VW_ACTIVE_OFFERS')) LOOP
      EXECUTE IMMEDIATE 'DROP VIEW ' || v.view_name;
   END LOOP;
   FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN (
      'REVIEW', 'DELIVERY', 'PAYMENT', 'ORDER_ITEM', 'ORDERS', 
      'ADDRESS', 'FOOD_INGREDIENT', 'FOOD_ITEM', 'FOOD_CATEGORY', 
      'RESTAURANT_CUISINE', 'RESTAURANT', 'COUPON', 'DELIVERY_PARTNER', 
      'CUSTOMER', 'PERSON_PHONE', 'PERSON'
   )) LOOP
      EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
   END LOOP;
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

-- ----------------------------------------------------------------------------
-- 1. PERSON (Supertype for Customer and Delivery Partner)
-- ----------------------------------------------------------------------------
CREATE TABLE PERSON (
    Person_ID           VARCHAR2(20) PRIMARY KEY,
    First_Name          VARCHAR2(50) NOT NULL,
    Last_Name           VARCHAR2(50) NOT NULL,
    Email               VARCHAR2(100) UNIQUE NOT NULL,
    Password            VARCHAR2(255) NOT NULL,
    Date_Of_Birth       DATE NOT NULL,
    Created_At          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. PERSON_PHONE (Multivalued attribute for Person)
-- ----------------------------------------------------------------------------
CREATE TABLE PERSON_PHONE (
    Person_ID           VARCHAR2(20) NOT NULL,
    Phone_Number        VARCHAR2(20) NOT NULL,
    PRIMARY KEY (Person_ID, Phone_Number),
    FOREIGN KEY (Person_ID) REFERENCES PERSON(Person_ID) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. CUSTOMER (Subtype of Person)
-- ----------------------------------------------------------------------------
CREATE TABLE CUSTOMER (
    Customer_ID         VARCHAR2(20) PRIMARY KEY,
    Loyalty_Points      NUMBER(8) DEFAULT 0 CHECK (Loyalty_Points >= 0),
    FOREIGN KEY (Customer_ID) REFERENCES PERSON(Person_ID) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 4. DELIVERY_PARTNER (Subtype of Person)
-- ----------------------------------------------------------------------------
CREATE TABLE DELIVERY_PARTNER (
    Partner_ID          VARCHAR2(20) PRIMARY KEY,
    Vehicle_Type        VARCHAR2(30) NOT NULL CHECK (Vehicle_Type IN ('BIKE', 'SCOOTER', 'ELECTRIC_VEHICLE', 'BICYCLE', 'CAR')),
    License_Number      VARCHAR2(50) UNIQUE NOT NULL,
    Availability_Status VARCHAR2(20) DEFAULT 'AVAILABLE' CHECK (Availability_Status IN ('AVAILABLE', 'BUSY', 'OFFLINE')),
    FOREIGN KEY (Partner_ID) REFERENCES PERSON(Person_ID) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5. RESTAURANT (Includes recursive Branch_Of relationship)
-- ----------------------------------------------------------------------------
CREATE TABLE RESTAURANT (
    Restaurant_ID        VARCHAR2(20) PRIMARY KEY,
    Name                 VARCHAR2(100) NOT NULL,
    Street               VARCHAR2(150) NOT NULL,
    City                 VARCHAR2(50) NOT NULL,
    State                VARCHAR2(50) NOT NULL,
    Postal_Code          VARCHAR2(20) NOT NULL,
    Parent_Restaurant_ID VARCHAR2(20),
    Image_URL            VARCHAR2(500),
    Is_Active            NUMBER(1) DEFAULT 1 CHECK (Is_Active IN (0, 1)),
    Created_At           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Parent_Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 6. RESTAURANT_CUISINE (Multivalued attribute for Restaurant)
-- ----------------------------------------------------------------------------
CREATE TABLE RESTAURANT_CUISINE (
    Restaurant_ID       VARCHAR2(20) NOT NULL,
    Cuisine_Type        VARCHAR2(50) NOT NULL,
    PRIMARY KEY (Restaurant_ID, Cuisine_Type),
    FOREIGN KEY (Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 7. FOOD_CATEGORY
-- ----------------------------------------------------------------------------
CREATE TABLE FOOD_CATEGORY (
    Category_ID         VARCHAR2(20) PRIMARY KEY,
    Category_Name       VARCHAR2(50) UNIQUE NOT NULL,
    Description         VARCHAR2(255)
);

-- ----------------------------------------------------------------------------
-- 8. FOOD_ITEM (Composite Primary Key: Food_ID, Restaurant_ID)
-- ----------------------------------------------------------------------------
CREATE TABLE FOOD_ITEM (
    Food_ID             VARCHAR2(20) NOT NULL,
    Restaurant_ID       VARCHAR2(20) NOT NULL,
    Name                VARCHAR2(100) NOT NULL,
    Description         VARCHAR2(500),
    Price               NUMBER(10, 2) NOT NULL CHECK (Price >= 0),
    Category_ID         VARCHAR2(20) NOT NULL,
    Is_Veg              NUMBER(1) DEFAULT 1 CHECK (Is_Veg IN (0, 1)),
    Image_URL           VARCHAR2(500),
    Is_Available        NUMBER(1) DEFAULT 1 CHECK (Is_Available IN (0, 1)),
    PRIMARY KEY (Food_ID, Restaurant_ID),
    FOREIGN KEY (Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID) ON DELETE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES FOOD_CATEGORY(Category_ID)
);

-- ----------------------------------------------------------------------------
-- 9. FOOD_INGREDIENT (Multivalued attribute for Food_Item)
-- ----------------------------------------------------------------------------
CREATE TABLE FOOD_INGREDIENT (
    Food_ID             VARCHAR2(20) NOT NULL,
    Restaurant_ID       VARCHAR2(20) NOT NULL,
    Ingredient_Name     VARCHAR2(100) NOT NULL,
    PRIMARY KEY (Food_ID, Restaurant_ID, Ingredient_Name),
    FOREIGN KEY (Food_ID, Restaurant_ID) REFERENCES FOOD_ITEM(Food_ID, Restaurant_ID) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 10. ADDRESS (Customer Addresses)
-- ----------------------------------------------------------------------------
CREATE TABLE ADDRESS (
    Address_ID          VARCHAR2(20) PRIMARY KEY,
    Customer_ID         VARCHAR2(20) NOT NULL,
    Street              VARCHAR2(150) NOT NULL,
    City                VARCHAR2(50) NOT NULL,
    State               VARCHAR2(50) NOT NULL,
    Postal_Code         VARCHAR2(20) NOT NULL,
    Address_Type        VARCHAR2(20) DEFAULT 'HOME' CHECK (Address_Type IN ('HOME', 'WORK', 'OTHER')),
    Is_Default          NUMBER(1) DEFAULT 0 CHECK (Is_Default IN (0, 1)),
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 11. COUPON
-- ----------------------------------------------------------------------------
CREATE TABLE COUPON (
    Coupon_ID           VARCHAR2(20) PRIMARY KEY,
    Code                VARCHAR2(30) UNIQUE NOT NULL,
    Discount_Percentage NUMBER(5, 2) NOT NULL CHECK (Discount_Percentage > 0 AND Discount_Percentage <= 100),
    Min_Order_Amount    NUMBER(10, 2) DEFAULT 0 CHECK (Min_Order_Amount >= 0),
    Max_Discount_Amount NUMBER(10, 2) DEFAULT 9999.99 CHECK (Max_Discount_Amount >= 0),
    Expiry_Date         DATE NOT NULL,
    Is_Active           NUMBER(1) DEFAULT 1 CHECK (Is_Active IN (0, 1))
);

-- ----------------------------------------------------------------------------
-- 12. ORDERS
-- ----------------------------------------------------------------------------
CREATE TABLE ORDERS (
    Order_ID            VARCHAR2(20) PRIMARY KEY,
    Customer_ID         VARCHAR2(20) NOT NULL,
    Restaurant_ID       VARCHAR2(20) NOT NULL,
    Address_ID          VARCHAR2(20) NOT NULL,
    Coupon_ID           VARCHAR2(20),
    Order_Date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    Order_Status        VARCHAR2(30) DEFAULT 'PLACED' CHECK (
        Order_Status IN ('PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')
    ),
    Special_Instructions VARCHAR2(255),
    Delivery_Fee        NUMBER(10, 2) DEFAULT 40.00 CHECK (Delivery_Fee >= 0),
    Tax_Amount          NUMBER(10, 2) DEFAULT 0.00 CHECK (Tax_Amount >= 0),
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID),
    FOREIGN KEY (Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID),
    FOREIGN KEY (Address_ID) REFERENCES ADDRESS(Address_ID),
    FOREIGN KEY (Coupon_ID) REFERENCES COUPON(Coupon_ID)
);

-- ----------------------------------------------------------------------------
-- 13. ORDER_ITEM (Associative Entity: Resolves ORDER <-> FOOD_ITEM M:N)
-- ----------------------------------------------------------------------------
CREATE TABLE ORDER_ITEM (
    Order_ID            VARCHAR2(20) NOT NULL,
    Food_ID             VARCHAR2(20) NOT NULL,
    Restaurant_ID       VARCHAR2(20) NOT NULL,
    Quantity            NUMBER(5) NOT NULL CHECK (Quantity > 0),
    Item_Price          NUMBER(10, 2) NOT NULL CHECK (Item_Price >= 0),
    PRIMARY KEY (Order_ID, Food_ID, Restaurant_ID),
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID) ON DELETE CASCADE,
    FOREIGN KEY (Food_ID, Restaurant_ID) REFERENCES FOOD_ITEM(Food_ID, Restaurant_ID)
);

-- ----------------------------------------------------------------------------
-- 14. PAYMENT
-- ----------------------------------------------------------------------------
CREATE TABLE PAYMENT (
    Payment_ID          VARCHAR2(20) PRIMARY KEY,
    Order_ID            VARCHAR2(20) NOT NULL,
    Payment_Method      VARCHAR2(30) NOT NULL CHECK (Payment_Method IN ('UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'CASH_ON_DELIVERY')),
    Payment_Status      VARCHAR2(20) DEFAULT 'COMPLETED' CHECK (Payment_Status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    Payment_Date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    Amount_Paid         NUMBER(10, 2) NOT NULL CHECK (Amount_Paid >= 0),
    Transaction_Ref     VARCHAR2(100),
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 15. DELIVERY
-- ----------------------------------------------------------------------------
CREATE TABLE DELIVERY (
    Delivery_ID         VARCHAR2(20) PRIMARY KEY,
    Order_ID            VARCHAR2(20) UNIQUE NOT NULL,
    Partner_ID          VARCHAR2(20),
    Pickup_Time         TIMESTAMP,
    Delivery_Time       TIMESTAMP,
    Delivery_Status     VARCHAR2(30) DEFAULT 'ASSIGNED' CHECK (
        Delivery_Status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED')
    ),
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID) ON DELETE CASCADE,
    FOREIGN KEY (Partner_ID) REFERENCES DELIVERY_PARTNER(Partner_ID)
);

-- ----------------------------------------------------------------------------
-- 16. REVIEW
-- ----------------------------------------------------------------------------
CREATE TABLE REVIEW (
    Review_ID           VARCHAR2(20) PRIMARY KEY,
    Customer_ID         VARCHAR2(20) NOT NULL,
    Restaurant_ID       VARCHAR2(20) NOT NULL,
    Order_ID            VARCHAR2(20) UNIQUE NOT NULL,
    Rating              NUMBER(2, 1) NOT NULL CHECK (Rating >= 1.0 AND Rating <= 5.0),
    Comment_Text        VARCHAR2(1000),
    Review_Date         TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID),
    FOREIGN KEY (Restaurant_ID) REFERENCES RESTAURANT(Restaurant_ID),
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID)
);



-- View 1: Restaurant Rating & Review Count (Derived)
CREATE OR REPLACE VIEW VW_RESTAURANT_RATINGS AS
SELECT 
    r.Restaurant_ID,
    r.Name AS Restaurant_Name,
    r.City,
    ROUND(NVL(AVG(rev.Rating), 4.2), 1) AS Avg_Rating,
    COUNT(rev.Review_ID) AS Review_Count
FROM RESTAURANT r
LEFT JOIN REVIEW rev ON r.Restaurant_ID = rev.Restaurant_ID
GROUP BY r.Restaurant_ID, r.Name, r.City;

-- View 2: Order Subtotal, Discount & Final Amount (Derived)
CREATE OR REPLACE VIEW VW_ORDER_SUMMARY AS
SELECT 
    o.Order_ID,
    o.Customer_ID,
    o.Restaurant_ID,
    o.Order_Date,
    o.Order_Status,
    o.Delivery_Fee,
    o.Tax_Amount,
    NVL(SUM(oi.Quantity * oi.Item_Price), 0) AS Subtotal,
    NVL(c.Discount_Percentage, 0) AS Coupon_Discount_Pct,
    LEAST(
        NVL(SUM(oi.Quantity * oi.Item_Price), 0) * (NVL(c.Discount_Percentage, 0) / 100),
        NVL(c.Max_Discount_Amount, 0)
    ) AS Discount_Amount,
    (
        NVL(SUM(oi.Quantity * oi.Item_Price), 0)
        - LEAST(
            NVL(SUM(oi.Quantity * oi.Item_Price), 0) * (NVL(c.Discount_Percentage, 0) / 100),
            NVL(c.Max_Discount_Amount, 0)
        )
        + o.Delivery_Fee
        + o.Tax_Amount
    ) AS Final_Price
FROM ORDERS o
LEFT JOIN ORDER_ITEM oi ON o.Order_ID = oi.Order_ID
LEFT JOIN COUPON c ON o.Coupon_ID = c.Coupon_ID
GROUP BY o.Order_ID, o.Customer_ID, o.Restaurant_ID, o.Order_Date, o.Order_Status, 
         o.Delivery_Fee, o.Tax_Amount, c.Discount_Percentage, c.Max_Discount_Amount;

-- View 3: Customer Age from Date of Birth (Derived)
CREATE OR REPLACE VIEW VW_CUSTOMER_AGE AS
SELECT 
    p.Person_ID,
    p.First_Name,
    p.Last_Name,
    p.Email,
    p.Date_Of_Birth,
    FLOOR(MONTHS_BETWEEN(TRUNC(SYSDATE), p.Date_Of_Birth) / 12) AS Age
FROM PERSON p
INNER JOIN CUSTOMER c ON p.Person_ID = c.Customer_ID;

-- View 4: Top Active Offers/Discounts (Derived)
CREATE OR REPLACE VIEW VW_ACTIVE_OFFERS AS
SELECT 
    NVL(MAX(Discount_Percentage), 0) AS Max_Discount_Percentage,
    COUNT(Coupon_ID) AS Active_Coupons_Count
FROM COUPON
WHERE Is_Active = 1 AND Expiry_Date >= TRUNC(SYSDATE);
