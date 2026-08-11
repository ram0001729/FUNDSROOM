const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get business settings
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
    if (result.rows.length === 0) {
      // Return defaults if somehow empty
      return res.json({ store_name: 'ShopKeeper', currency: 'INR', tax_rate: 0 });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update business settings
router.put('/', authMiddleware(['Admin']), async (req, res) => {
  try {
    const { store_name, store_address, gst_number, currency, tax_rate, email, phone } = req.body;
    
    // Ensure at least one record exists
    const checkRes = await db.query('SELECT id FROM settings ORDER BY id ASC LIMIT 1');
    
    let query, values;
    
    if (checkRes.rows.length === 0) {
      // Insert
      query = `
        INSERT INTO settings (store_name, store_address, gst_number, currency, tax_rate, email, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      `;
      values = [store_name, store_address, gst_number, currency, tax_rate, email, phone];
    } else {
      // Update
      const id = checkRes.rows[0].id;
      query = `
        UPDATE settings 
        SET store_name=$1, store_address=$2, gst_number=$3, currency=$4, tax_rate=$5, email=$6, phone=$7, updated_at=CURRENT_TIMESTAMP
        WHERE id=$8 RETURNING *
      `;
      values = [store_name, store_address, gst_number, currency, tax_rate, email, phone, id];
    }
    
    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
