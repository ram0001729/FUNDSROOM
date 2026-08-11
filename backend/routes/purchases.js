const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all purchase orders
router.get('/', authMiddleware(['Admin', 'Warehouse', 'Accounts']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT po.*, u.username as created_by_name,
             (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = po.id) as total_items
      FROM purchase_orders po
      LEFT JOIN users u ON po.created_by = u.id
      ORDER BY po.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single PO details
router.get('/:id', authMiddleware(['Admin', 'Warehouse', 'Accounts']), async (req, res) => {
  try {
    const poRes = await db.query('SELECT * FROM purchase_orders WHERE id = $1', [req.params.id]);
    if (poRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    const itemsRes = await db.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [req.params.id]);
    
    res.json({
      success: true,
      data: {
        ...poRes.rows[0],
        items: itemsRes.rows
      }
    });
  } catch (error) {
    console.error('Error fetching PO detail:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new Purchase Order
router.post('/', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  const { supplier_name, items, notes } = req.body;

  if (!supplier_name || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Supplier name and items are required' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Generate PO Number
    const countRes = await client.query('SELECT COUNT(*) FROM purchase_orders');
    const poNumber = `PO-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += parseFloat(item.unit_price) * parseInt(item.quantity);
    }

    // Insert PO
    const poRes = await client.query(
      `INSERT INTO purchase_orders (po_number, supplier_name, total_amount, status, notes, created_by)
       VALUES ($1, $2, $3, 'Pending', $4, $5) RETURNING *`,
      [poNumber, supplier_name, totalAmount, notes || null, req.user.id]
    );

    const poId = poRes.rows[0].id;

    // Insert PO Items
    for (const item of items) {
      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [poId, item.product_id, item.product_name, item.unit_price, item.quantity, parseFloat(item.unit_price) * parseInt(item.quantity)]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: poRes.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating purchase order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// Mark PO as Received & Automatically add stock
router.post('/:id/receive', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  const { id } = req.params;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const poCheck = await client.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
    if (poCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    const po = poCheck.rows[0];
    if (po.status === 'Received') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Purchase order already marked as received' });
    }

    // Get items
    const itemsRes = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [id]);

    // Update stock for each product
    for (const item of itemsRes.rows) {
      await client.query(
        'UPDATE products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [item.quantity, item.product_id]
      );

      // Log stock movement IN
      await client.query(
        `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
         VALUES ($1, $2, 'IN', $3, $4)`,
        [item.product_id, item.quantity, `Purchase Order Received #${po.po_number}`, req.user.id]
      );
    }

    // Update PO status
    await client.query("UPDATE purchase_orders SET status = 'Received', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Purchase order received and stock updated successfully!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error receiving PO:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
