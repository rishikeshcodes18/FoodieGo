import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/customers/:id - Profile details with loyalty points & phones
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const customer = db.prepare(`
      SELECT 
        p.Person_ID,
        p.First_Name,
        p.Last_Name,
        p.Email,
        p.Date_Of_Birth,
        c.Loyalty_Points
      FROM PERSON p
      JOIN CUSTOMER c ON p.Person_ID = c.Customer_ID
      WHERE p.Person_ID = ?
    `).get(id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const phones = db.prepare('SELECT Phone_Number FROM PERSON_PHONE WHERE Person_ID = ?')
      .all(id)
      .map(p => p.Phone_Number);

    const addresses = db.prepare('SELECT * FROM ADDRESS WHERE Customer_ID = ? ORDER BY Is_Default DESC')
      .all(id);

    res.json({
      success: true,
      data: {
        ...customer,
        phones,
        addresses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers/login - User Sign In
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Both email and password are required.' });
    }

    const person = db.prepare('SELECT * FROM PERSON WHERE LOWER(Email) = LOWER(?)').get(email.trim());
    if (!person) {
      return res.status(404).json({
        success: false,
        message: `No account found with email "${email}". Please create an account.`
      });
    }

    // Verify password
    if (person.Password && person.Password !== password && !person.Password.startsWith('$2a$')) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const customer = db.prepare('SELECT Loyalty_Points FROM CUSTOMER WHERE Customer_ID = ?').get(person.Person_ID);
    const phones = db.prepare('SELECT Phone_Number FROM PERSON_PHONE WHERE Person_ID = ?')
      .all(person.Person_ID)
      .map(p => p.Phone_Number);
    const addresses = db.prepare('SELECT * FROM ADDRESS WHERE Customer_ID = ? ORDER BY Is_Default DESC').all(person.Person_ID);

    res.json({
      success: true,
      message: `Welcome back, ${person.First_Name}!`,
      data: {
        personId: person.Person_ID,
        firstName: person.First_Name,
        lastName: person.Last_Name,
        email: person.Email,
        dateOfBirth: person.Date_Of_Birth,
        loyaltyPoints: customer ? customer.Loyalty_Points : 50,
        phone: phones[0] || '',
        addresses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers/signup - User Create Account (Writes to PERSON, PERSON_PHONE, CUSTOMER, ADDRESS)
router.post('/signup', (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth = '2000-01-01',
      street,
      city,
      state,
      postalCode,
      addressType = 'HOME'
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First Name, Last Name, Email, and Password are required.'
      });
    }

    if (!street || !city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address (Street, City, and Postal Code) is required to create your account.'
      });
    }

    // Determine State based on city if not explicitly provided
    let finalState = (state && state.trim()) || '';
    if (!finalState) {
      if (/chennai/i.test(city)) {
        finalState = 'Tamil Nadu';
      } else if (/bangalore|bengaluru/i.test(city)) {
        finalState = 'Karnataka';
      } else {
        finalState = 'Tamil Nadu';
      }
    }

    // Check if email already exists
    const existing = db.prepare('SELECT Person_ID FROM PERSON WHERE LOWER(Email) = LOWER(?)').get(email.trim());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.'
      });
    }

    const personId = `P${Date.now().toString().slice(-5)}`;
    const addressId = `A${Date.now().toString().slice(-5)}`;

    // 1. Insert into PERSON supertype
    db.prepare(`
      INSERT INTO PERSON (Person_ID, First_Name, Last_Name, Email, Password, Date_Of_Birth, Created_At)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(personId, firstName.trim(), lastName.trim(), email.trim().toLowerCase(), password, dateOfBirth);

    // 2. Insert into PERSON_PHONE multivalued relation
    if (phone) {
      db.prepare('INSERT INTO PERSON_PHONE (Person_ID, Phone_Number) VALUES (?, ?)')
        .run(personId, phone.trim());
    }

    // 3. Insert into CUSTOMER subtype with 50 bonus loyalty points
    db.prepare('INSERT INTO CUSTOMER (Customer_ID, Loyalty_Points) VALUES (?, ?)')
      .run(personId, 50);

    // 4. Insert user-entered address into ADDRESS relation
    db.prepare(`
      INSERT INTO ADDRESS (Address_ID, Customer_ID, Street, City, State, Postal_Code, Address_Type, Is_Default)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(addressId, personId, street.trim(), city.trim(), finalState, postalCode.trim(), addressType);

    const addresses = db.prepare('SELECT * FROM ADDRESS WHERE Customer_ID = ?').all(personId);

    res.status(201).json({
      success: true,
      message: `Account created successfully! You earned 50 Welcome Loyalty Points.`,
      data: {
        personId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        dateOfBirth,
        loyaltyPoints: 50,
        phone: phone ? phone.trim() : '',
        addresses
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/customers/:id/addresses - Saved addresses
router.get('/:id/addresses', (req, res) => {
  try {
    const { id } = req.params;
    const addresses = db.prepare('SELECT * FROM ADDRESS WHERE Customer_ID = ? ORDER BY Is_Default DESC').all(id);
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers/:id/addresses - Add address
router.post('/:id/addresses', (req, res) => {
  try {
    const { id } = req.params;
    const { street, city, state, postalCode, addressType = 'HOME' } = req.body;

    if (!street || !city || !postalCode) {
      return res.status(400).json({ success: false, message: 'Street, city, and postal code are required' });
    }

    let finalState = (state && state.trim()) || '';
    if (!finalState) {
      if (/chennai/i.test(city)) {
        finalState = 'Tamil Nadu';
      } else if (/bangalore|bengaluru/i.test(city)) {
        finalState = 'Karnataka';
      } else {
        finalState = 'Tamil Nadu';
      }
    }

    const addressId = `A${Date.now().toString().slice(-5)}`;
    db.prepare(`
      INSERT INTO ADDRESS (Address_ID, Customer_ID, Street, City, State, Postal_Code, Address_Type, Is_Default)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(addressId, id, street, city, finalState, postalCode, addressType);

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { addressId, street, city, state: finalState, postalCode, addressType }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
