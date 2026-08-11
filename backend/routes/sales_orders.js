const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all sales orders
router.get('/', authMiddleware(['Admin', 'Sales', 'Warehouse', 'Accounts']), async (req, res) => {
  try {
    const { source } = req.query;
    let query = `
       SELECT so.*, c.name as customer_name 
       FROM sales_orders so 
       LEFT JOIN customers c ON so.customer_id = c.id
    `;
    const params = [];
    
    if (source) {
      query += ` WHERE so.sales_source = $1 `;
      params.push(source);
    }
    
    query += ` ORDER BY so.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new sales order
router.post('/', authMiddleware(['Admin', 'Sales']), async (req, res) => {
  const { customer_id, items, sales_source = 'OFFLINE' } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get customer name
    let customerName = 'Walk-in Customer';
    if (customer_id) {
      const custResult = await client.query('SELECT name FROM customers WHERE id = $1', [customer_id]);
      if (custResult.rows.length > 0) customerName = custResult.rows[0].name;
    }

    // Generate Order Number
    const countResult = await client.query('SELECT COUNT(*) FROM sales_orders');
    const orderNumber = `SO-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.unit_price * item.quantity;
    }

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO sales_orders (order_number, customer_id, customer_name, total_amount, sales_source, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [orderNumber, customer_id, customerName, totalAmount, sales_source, req.user.id]
    );
    const orderId = orderResult.rows[0].id;

    // Insert items
    for (const item of items) {
      await client.query(
        `INSERT INTO sales_order_items (sales_order_id, product_id, product_name, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.unit_price * item.quantity]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: orderResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sales order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// Reserve stock for a sales order (Warehouse Action)
router.post('/:id/reserve', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check order status
    const orderCheck = await client.query('SELECT status FROM sales_orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
       await client.query('ROLLBACK');
       return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (orderCheck.rows[0].status !== 'Created') {
       await client.query('ROLLBACK');
       return res.status(400).json({ success: false, message: 'Stock already reserved or order processed' });
    }

    // Get items
    const items = await client.query('SELECT product_id, quantity FROM sales_order_items WHERE sales_order_id = $1', [id]);

    for (const item of items.rows) {
       // Increment reserved_stock
       await client.query(
         'UPDATE products SET reserved_stock = reserved_stock + $1 WHERE id = $2',
         [item.quantity, item.product_id]
       );
       
       // Log movement
       await client.query(
         `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
          VALUES ($1, $2, $3, $4, $5)`,
         [item.product_id, item.quantity, 'RESERVE', `Reserved for SO #${id}`, req.user.id]
       );
    }

    // Update order status
    await client.query("UPDATE sales_orders SET status = 'Stock Reserved' WHERE id = $1", [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Stock reserved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reserving stock:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
