const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all customers with optional search and pagination
router.get('/', authMiddleware(['Admin', 'Sales', 'Accounts']), async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10, status, has_follow_up, has_notes } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM customers';
    const params = [];
    const whereClauses = [];

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(name ILIKE $${params.length} OR mobile ILIKE $${params.length} OR business_name ILIKE $${params.length})`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }

    if (has_follow_up === 'true') {
      whereClauses.push(`follow_up_date IS NOT NULL`);
    }

    if (has_notes === 'true') {
      whereClauses.push(`notes IS NOT NULL AND notes != ''`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    if (has_follow_up === 'true') {
      query += ` ORDER BY follow_up_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    } else if (has_notes === 'true') {
      query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    } else {
      query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    }
    
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM customers';
    const countParams = [];
    const countWhereClauses = [];
    
    if (search) {
      countParams.push(`%${search}%`);
      countWhereClauses.push(`(name ILIKE $${countParams.length} OR mobile ILIKE $${countParams.length} OR business_name ILIKE $${countParams.length})`);
    }
    if (status) {
      countParams.push(status);
      countWhereClauses.push(`status = $${countParams.length}`);
    }
    if (has_follow_up === 'true') {
      countWhereClauses.push(`follow_up_date IS NOT NULL`);
    }
    if (has_notes === 'true') {
      countWhereClauses.push(`notes IS NOT NULL AND notes != ''`);
    }
    if (countWhereClauses.length > 0) {
      countQuery += ' WHERE ' + countWhereClauses.join(' AND ');
    }
    
    const countResult = await db.query(countQuery, countParams);
    
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single customer
router.get('/:id', authMiddleware(['Admin', 'Sales', 'Accounts']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer purchase history
router.get('/:id/purchases', authMiddleware(['Admin', 'Sales', 'Accounts']), async (req, res) => {
  try {
    const query = `
      SELECT ch.created_at as purchase_date, ch.challan_number, ci.product_snapshot_name as product_name, 
             ci.quantity, ci.product_snapshot_price as unit_price, 
             (ci.quantity * ci.product_snapshot_price) as total_price, ch.status
      FROM challans ch
      JOIN challan_items ci ON ch.id = ci.challan_id
      WHERE ch.customer_id = $1
      ORDER BY ch.created_at DESC
    `;
    const result = await db.query(query, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer purchases:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new customer
router.post('/', authMiddleware(['Admin', 'Sales']), async (req, res) => {
  try {
    const { name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const query = `
      INSERT INTO customers 
      (name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `;
    const values = [name, mobile, email, business_name, gst_number, type, address, status || 'Active', follow_up_date || null, notes];
    
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a customer
router.put('/:id', authMiddleware(['Admin', 'Sales']), async (req, res) => {
  try {
    const { name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes } = req.body;
    
    const query = `
      UPDATE customers 
      SET name = $1, mobile = $2, email = $3, business_name = $4, gst_number = $5, type = $6, address = $7, status = $8, follow_up_date = $9, notes = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 RETURNING *
    `;
    const values = [name, mobile, email, business_name, gst_number, type, address, status, follow_up_date || null, notes, req.params.id];
    
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
