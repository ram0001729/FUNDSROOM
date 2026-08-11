const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all invoices
router.get('/', authMiddleware(['Admin', 'Sales', 'Warehouse', 'Accounts']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Generate Invoice from Sales Order (Accounts)
router.post('/from-order/:sales_order_id', authMiddleware(['Admin', 'Accounts']), async (req, res) => {
  const { sales_order_id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get Sales Order
    const orderRes = await client.query('SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE', [sales_order_id]);
    if (orderRes.rows.length === 0) throw new Error('Sales order not found');
    const order = orderRes.rows[0];

    // Assuming we only invoice dispatched or delivered orders
    if (order.status === 'Created' || order.status === 'Stock Reserved') {
      throw new Error('Order must be dispatched before invoicing');
    }
    
    if (order.status === 'Invoiced' || order.status === 'Paid') {
      throw new Error('Order is already invoiced');
    }

    // Generate Invoice Number
    const countResult = await client.query('SELECT COUNT(*) FROM invoices');
    const invNumber = `INV-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

    // Create Invoice
    const invoiceRes = await client.query(
      `INSERT INTO invoices (invoice_number, sales_order_id, customer_id, total_amount, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [invNumber, sales_order_id, order.customer_id, order.total_amount, req.user.id]
    );

    // Update order status
    await client.query("UPDATE sales_orders SET status = 'Invoiced' WHERE id = $1", [sales_order_id]);

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: invoiceRes.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating invoice:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
