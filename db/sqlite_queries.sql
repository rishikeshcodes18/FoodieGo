-- ==============================================================================
-- PREREQUISITE: Enable Foreign Keys
-- Short Use: Ensures database integrity and enforces relational foreign key constraints.
-- ==============================================================================
PRAGMA foreign_keys = ON;
-- ==============================================================================
-- TRIGGER 1: trg_award_loyalty_points
-- Short Use: Automatically calculates and awards 10% loyalty points to customer
--            balance whenever a payment status is marked 'COMPLETED'.
-- ==============================================================================
CREATE TRIGGER IF NOT EXISTS trg_award_loyalty_points
AFTER INSERT ON PAYMENT
FOR EACH ROW
WHEN NEW.Payment_Status = 'COMPLETED'
BEGIN
    UPDATE CUSTOMER
    SET Loyalty_Points = Loyalty_Points + CAST(NEW.Amount_Paid * 0.10 AS INTEGER)
    WHERE Customer_ID = (
        SELECT Customer_ID FROM ORDERS WHERE Order_ID = NEW.Order_ID
    );
END;
-- 
--==============================================================================
-- TRIGGER 2: trg_validate_coupon_before_order
-- Short Use: Validates that an applied coupon exists, is active (Is_Active = 1),
--            and has not expired before inserting a new order. Aborts if invalid.
-- ==============================================================================
CREATE TRIGGER IF NOT EXISTS trg_validate_coupon_before_order
BEFORE INSERT ON ORDERS
FOR EACH ROW
WHEN NEW.Coupon_ID IS NOT NULL
BEGIN
    SELECT
        CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM COUPON 
                WHERE Coupon_ID = NEW.Coupon_ID 
                  AND Is_Active = 1 
                  AND Expiry_Date >= date('now')
            ) THEN
                RAISE(ABORT, 'ERROR: Coupon is invalid, inactive, or expired.')
        END;
END;
-- ==============================================================================
-- TRIGGER 3: trg_partner_busy_on_assignment
-- Short Use: Automatically switches a delivery partner's status to 'BUSY'
--            when assigned or in-transit with an active delivery.
-- ==============================================================================
CREATE TRIGGER IF NOT EXISTS trg_partner_busy_on_assignment
AFTER INSERT ON DELIVERY
FOR EACH ROW
WHEN NEW.Partner_ID IS NOT NULL AND NEW.Delivery_Status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
BEGIN
    UPDATE DELIVERY_PARTNER
    SET Availability_Status = 'BUSY'
    WHERE Partner_ID = NEW.Partner_ID;
END;
-- ==============================================================================
-- TRIGGER 4: trg_partner_available_on_completion
-- Short Use: Automatically sets delivery partner status back to 'AVAILABLE'
--            once delivery is updated to 'DELIVERED' or 'FAILED'.
-- ==============================================================================
CREATE TRIGGER IF NOT EXISTS trg_partner_available_on_completion
AFTER UPDATE OF Delivery_Status ON DELIVERY
FOR EACH ROW
WHEN NEW.Delivery_Status IN ('DELIVERED', 'FAILED')
BEGIN
    UPDATE DELIVERY_PARTNER
    SET Availability_Status = 'AVAILABLE'
    WHERE Partner_ID = NEW.Partner_ID;
END;
-- ==============================================================================
-- TRIGGER 5: trg_validate_review_rating
-- Short Use: Enforces data validation ensuring submitted review ratings are
--            within the valid range of 1.0 to 5.0 stars.
-- ==============================================================================
CREATE TRIGGER IF NOT EXISTS trg_validate_review_rating
BEFORE INSERT ON REVIEW
FOR EACH ROW
WHEN NEW.Rating < 1.0 OR NEW.Rating > 5.0
BEGIN
    SELECT RAISE(ABORT, 'ERROR: Review rating must be between 1.0 and 5.0 stars.');
END;
-- ==============================================================================
-- QUERY 1: Recursive CTE - Restaurant Chain & Branch Hierarchy
-- Short Use: Traverses hierarchical restaurant parent-child relationships to
--            list headquarters and their child branches along with hierarchy levels.
-- ==============================================================================
WITH RECURSIVE RestaurantHierarchy AS (
    SELECT 
        Restaurant_ID,
        Name,
        City,
        Parent_Restaurant_ID,
        1 AS Hierarchy_Level,
        Name AS Root_Chain_Name
    FROM RESTAURANT
    WHERE Parent_Restaurant_ID IS NULL

    UNION ALL

    SELECT 
        r.Restaurant_ID,
        r.Name,
        r.City,
        r.Parent_Restaurant_ID,
        rh.Hierarchy_Level + 1 AS Hierarchy_Level,
        rh.Root_Chain_Name
    FROM RESTAURANT r
    INNER JOIN RestaurantHierarchy rh ON r.Parent_Restaurant_ID = rh.Restaurant_ID
)
SELECT 
    Hierarchy_Level,
    Root_Chain_Name,
    Restaurant_ID,
    Name AS Branch_Name,
    City
FROM RestaurantHierarchy
ORDER BY Root_Chain_Name, Hierarchy_Level;
-- ==============================================================================
-- QUERY 2: Window Function - Top Selling Menu Items by Category (DENSE_RANK)
-- Short Use: Calculates total quantity sold and revenue per item, ranking items
--            within each category using the DENSE_RANK() window function.
-- ==============================================================================
SELECT 
    fc.Category_Name,
    fi.Name AS Item_Name,
    fi.Price,
    COALESCE(SUM(oi.Quantity), 0) AS Total_Quantity_Sold,
    COALESCE(SUM(oi.Quantity * oi.Item_Price), 0.0) AS Total_Revenue,
    DENSE_RANK() OVER (
        PARTITION BY fi.Category_ID 
        ORDER BY COALESCE(SUM(oi.Quantity), 0) DESC
    ) AS Category_Sales_Rank
FROM FOOD_ITEM fi
INNER JOIN FOOD_CATEGORY fc ON fi.Category_ID = fc.Category_ID
LEFT JOIN ORDER_ITEM oi ON fi.Food_ID = oi.Food_ID AND fi.Restaurant_ID = oi.Restaurant_ID
GROUP BY fi.Category_ID, fi.Food_ID, fi.Restaurant_ID, fi.Name, fi.Price, fc.Category_Name
ORDER BY fc.Category_Name, Category_Sales_Rank;
-- ==============================================================================
-- QUERY 3: Customer Tier Classification & Running Cumulative Revenue
-- Short Use: Segment customers into tiers (Platinum, Gold, Silver) based on
--            spending and computes cumulative running total revenue across the platform.
-- ==============================================================================
SELECT 
    p.Person_ID,
    p.First_Name || ' ' || p.Last_Name AS Customer_Name,
    p.Email,
    c.Loyalty_Points,
    COUNT(DISTINCT o.Order_ID) AS Total_Orders,
    COALESCE(SUM(pay.Amount_Paid), 0.0) AS Total_Spent,
    CASE 
        WHEN COALESCE(SUM(pay.Amount_Paid), 0.0) >= 1000 THEN 'PLATINUM VIP'
        WHEN COALESCE(SUM(pay.Amount_Paid), 0.0) >= 500  THEN 'GOLD MEMBER'
        WHEN COALESCE(SUM(pay.Amount_Paid), 0.0) > 0    THEN 'SILVER MEMBER'
        ELSE 'NEW / INACTIVE'
    END AS Customer_Tier,
    SUM(COALESCE(SUM(pay.Amount_Paid), 0.0)) OVER (
        ORDER BY COALESCE(SUM(pay.Amount_Paid), 0.0) DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS Cumulative_Platform_Revenue
FROM CUSTOMER c
JOIN PERSON p ON c.Customer_ID = p.Person_ID
LEFT JOIN ORDERS o ON c.Customer_ID = o.Customer_ID
LEFT JOIN PAYMENT pay ON o.Order_ID = pay.Order_ID AND pay.Payment_Status = 'COMPLETED'
GROUP BY p.Person_ID, p.First_Name, p.Last_Name, p.Email, c.Loyalty_Points
ORDER BY Total_Spent DESC;
-- ==============================================================================
-- QUERY 4: Restaurant Performance & Average Rating Report
-- Short Use: Aggregates total orders, total gross revenue, review counts,
--            and average customer rating for each restaurant.
-- ==============================================================================
SELECT 
    r.Restaurant_ID,
    r.Name AS Restaurant_Name,
    r.City,
    COUNT(DISTINCT o.Order_ID) AS Total_Orders_Received,
    ROUND(AVG(rev.Rating), 2) AS Average_Customer_Rating,
    COUNT(rev.Review_ID) AS Total_Reviews_Count,
    COALESCE(SUM(oi.Quantity * oi.Item_Price), 0.0) AS Total_Gross_Sales
FROM RESTAURANT r
LEFT JOIN ORDERS o ON r.Restaurant_ID = o.Restaurant_ID
LEFT JOIN ORDER_ITEM oi ON o.Order_ID = oi.Order_ID
LEFT JOIN REVIEW rev ON r.Restaurant_ID = rev.Restaurant_ID
GROUP BY r.Restaurant_ID, r.Name, r.City
ORDER BY Total_Gross_Sales DESC, Average_Customer_Rating DESC;
-- ==============================================================================
-- QUERY 5: Delivery Partner Fleet Performance Summary
-- Short Use: Evaluates delivery partner metrics including assigned orders,
--            completed deliveries, and failed deliveries.
-- ==============================================================================
SELECT 
    p.Person_ID AS Partner_ID,
    p.First_Name || ' ' || p.Last_Name AS Partner_Name,
    dp.Vehicle_Type,
    dp.Availability_Status,
    COUNT(d.Delivery_ID) AS Total_Assigned_Deliveries,
    SUM(CASE WHEN d.Delivery_Status = 'DELIVERED' THEN 1 ELSE 0 END) AS Completed_Deliveries,
    SUM(CASE WHEN d.Delivery_Status = 'FAILED' THEN 1 ELSE 0 END) AS Failed_Deliveries
FROM DELIVERY_PARTNER dp
JOIN PERSON p ON dp.Partner_ID = p.Person_ID
LEFT JOIN DELIVERY d ON dp.Partner_ID = d.Partner_ID
GROUP BY p.Person_ID, p.First_Name, p.Last_Name, dp.Vehicle_Type, dp.Availability_Status
ORDER BY Completed_Deliveries DESC;
-- ==============================================================================
-- TRANSACTION: Atomic End-to-End Order Placement Simulation
-- Short Use: Demonstrates an ACID transaction in SQLite that places an order,
--            inserts items, records payment, and schedules delivery atomically.
-- ==============================================================================
BEGIN TRANSACTION;

INSERT INTO ORDERS (
    Order_ID, Customer_ID, Restaurant_ID, Address_ID, Coupon_ID, 
    Order_Date, Order_Status, Special_Instructions, Delivery_Fee, Tax_Amount
) VALUES (
    'ORD999', 'P001', 'R001', 'A001', 'CP03', 
    datetime('now'), 'CONFIRMED', 'Please make it extra spicy', 40.00, 20.00
);

INSERT INTO ORDER_ITEM (Order_ID, Food_ID, Restaurant_ID, Quantity, Item_Price)
VALUES 
    ('ORD999', 'F001', 'R001', 1, 340.00),
    ('ORD999', 'F002', 'R001', 1, 290.00);

INSERT INTO PAYMENT (
    Payment_ID, Order_ID, Payment_Method, Payment_Status, Payment_Date, Amount_Paid, Transaction_Ref
) VALUES (
    'PAY999', 'ORD999', 'UPI', 'COMPLETED', datetime('now'), 590.00, 'UPI-TXN-999888777'
);

INSERT INTO DELIVERY (
    Delivery_ID, Order_ID, Partner_ID, Pickup_Time, Delivery_Status
) VALUES (
    'DEL999', 'ORD999', 'P004', datetime('now'), 'ASSIGNED'
);

COMMIT;
-- ==============================================================================
-- QUERY 6: Detailed Order Invoices & Customer Tracking
-- Short Use: Comprehensive multi-table JOIN showing complete customer order details,
--            item breakdown, line totals, applied discounts, and payment status.
-- ==============================================================================
SELECT 
    o.Order_ID,
    o.Order_Date,
    o.Order_Status,
    p.First_Name || ' ' || p.Last_Name AS Customer_Name,
    r.Name AS Restaurant_Name,
    fi.Name AS Item_Ordered,
    oi.Quantity,
    oi.Item_Price,
    (oi.Quantity * oi.Item_Price) AS Line_Total,
    o.Delivery_Fee,
    o.Tax_Amount,
    COALESCE(c.Code, 'NO COUPON') AS Coupon_Applied,
    pay.Payment_Method,
    pay.Payment_Status,
    pay.Amount_Paid
FROM ORDERS o
JOIN CUSTOMER cust ON o.Customer_ID = cust.Customer_ID
JOIN PERSON p ON cust.Customer_ID = p.Person_ID
JOIN RESTAURANT r ON o.Restaurant_ID = r.Restaurant_ID
JOIN ORDER_ITEM oi ON o.Order_ID = oi.Order_ID
JOIN FOOD_ITEM fi ON oi.Food_ID = fi.Food_ID AND oi.Restaurant_ID = fi.Restaurant_ID
LEFT JOIN COUPON c ON o.Coupon_ID = c.Coupon_ID
LEFT JOIN PAYMENT pay ON o.Order_ID = pay.Order_ID
ORDER BY o.Order_Date DESC;
-- ==============================================================================
-- QUERY 7: Filtered Menu Search (Budget Veg Items)
-- Short Use: Filters menu items for affordable vegetarian options priced at or
--            under ₹250.00 that are currently available.
-- ==============================================================================
SELECT 
    fi.Food_ID,
    fi.Name AS Dish_Name,
    r.Name AS Restaurant_Name,
    fc.Category_Name,
    fi.Price,
    CASE WHEN fi.Is_Veg = 1 THEN 'Vegetarian (Green)' ELSE 'Non-Vegetarian (Red)' END AS Dietary_Type,
    fi.Description
FROM FOOD_ITEM fi
JOIN RESTAURANT r ON fi.Restaurant_ID = r.Restaurant_ID
JOIN FOOD_CATEGORY fc ON fi.Category_ID = fc.Category_ID
WHERE fi.Is_Available = 1 
  AND fi.Is_Veg = 1 
  AND fi.Price <= 250.00
ORDER BY fi.Price ASC;
-- ==============================================================================

-- PL/SQL: Explicit Cursor 1 - List high-value orders
DECLARE
    cur_orders CURSOR FOR
        SELECT Order_ID, Total_Amount
        FROM (
            SELECT o.Order_ID,
                   SUM(oi.Quantity * oi.Item_Price) + o.Delivery_Fee + o.Tax_Amount AS Total_Amount
            FROM ORDERS o
            JOIN ORDER_ITEM oi ON o.Order_ID = oi.Order_ID
            GROUP BY o.Order_ID
        ) WHERE Total_Amount > 1000;
    rec_order RECORD;
BEGIN
    OPEN cur_orders;
    LOOP
        FETCH cur_orders INTO rec_order;
        EXIT WHEN NOT FOUND;
        DBMS_OUTPUT.PUT_LINE('Order: ' || rec_order.Order_ID || ', Amount: ' || rec_order.Total_Amount);
    END LOOP;
    CLOSE cur_orders;
END;
/

-- PL/SQL: Explicit Cursor 2 - Update partner status based on deliveries
DECLARE
    cur_partners CURSOR FOR
        SELECT Partner_ID, COUNT(*) AS Delivered_Count
        FROM DELIVERY
        WHERE Delivery_Status = 'DELIVERED'
        GROUP BY Partner_ID
        HAVING COUNT(*) > 10;
    rec_partner RECORD;
BEGIN
    FOR rec_partner IN cur_partners LOOP
        UPDATE DELIVERY_PARTNER
        SET Availability_Status = 'BUSY'
        WHERE Partner_ID = rec_partner.Partner_ID;
    END LOOP;
END;
/

-- PL/SQL: Implicit Cursor 1 - Simple SELECT INTO
DECLARE
    v_total_sales NUMBER;
BEGIN
    SELECT COALESCE(SUM(oi.Quantity * oi.Item_Price),0)
    INTO v_total_sales
    FROM ORDER_ITEM oi;
    DBMS_OUTPUT.PUT_LINE('Total Sales: ' || v_total_sales);
END;
/

-- PL/SQL: Implicit Cursor 2 - FOR loop over result set
BEGIN
    FOR rec IN (SELECT Customer_ID, SUM(Amount_Paid) AS Total_Spent
                FROM PAYMENT
                WHERE Payment_Status = 'COMPLETED'
                GROUP BY Customer_ID
                HAVING SUM(Amount_Paid) > 500) LOOP
        DBMS_OUTPUT.PUT_LINE('Customer: ' || rec.Customer_ID || ', Spent: ' || rec.Total_Spent);
    END LOOP;
END;
/

-- ==============================================================================
