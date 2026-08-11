const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { sendInvoiceEmail } = require('../utils/emailService');

// Get billing summary and invoices for a period
router.get('/billing/summary', authMiddleware(['Admin', 'Sales', 'Accounts', 'Warehouse']), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    let soDateFilter = '';
    if (period === 'today') {
      dateFilter = "DATE(ch.created_at) = CURRENT_DATE";
      soDateFilter = "DATE(so.created_at) = CURRENT_DATE";
    } else if (period === 'month') {
      dateFilter = "ch.created_at >= date_trunc('month', CURRENT_DATE)";
      soDateFilter = "so.created_at >= date_trunc('month', CURRENT_DATE)";
    } else if (period === '6months') {
      dateFilter = "ch.created_at >= CURRENT_DATE - INTERVAL '6 months'";
      soDateFilter = "so.created_at >= CURRENT_DATE - INTERVAL '6 months'";
    } else {
      dateFilter = "ch.created_at >= date_trunc('month', CURRENT_DATE)";
      soDateFilter = "so.created_at >= date_trunc('month', CURRENT_DATE)";
    }

    // Sales list (UNION of Challans and Sales Orders)
    const salesQuery = `
      SELECT ch.created_at, ci.product_snapshot_name as product_name, COALESCE(p.category, 'General') as category, ci.quantity, ci.product_snapshot_price as unit_price,
             (ci.quantity * ci.product_snapshot_price) as total_price,
             COALESCE(ch.customer_name, c.name, 'Walk-in') as customer_name
      FROM challan_items ci
      JOIN challans ch ON ci.challan_id = ch.id
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN customers c ON ch.customer_id = c.id
      WHERE ch.status != 'Cancelled' AND ${dateFilter}
      
      UNION ALL

      SELECT so.created_at, p.name as product_name, COALESCE(p.category, 'General') as category, soi.quantity, soi.unit_price,
             (soi.quantity * soi.unit_price) as total_price,
             COALESCE(c.name, 'Walk-in') as customer_name
      FROM sales_order_items soi
      JOIN sales_orders so ON soi.sales_order_id = so.id
      LEFT JOIN products p ON soi.product_id = p.id
      LEFT JOIN customers c ON so.customer_id = c.id
      WHERE so.status != 'Cancelled' AND ${soDateFilter}

      ORDER BY created_at DESC
    `;
    const salesResult = await db.query(salesQuery);
    
    // KPI Aggregates
    const statsQuery = `
      SELECT 
        (SELECT COUNT(id) FROM invoices WHERE status != 'Cancelled') as total_invoices,
        COALESCE(SUM(total_price), 0) as total_sales,
        COALESCE(SUM(total_price * 0.25), 0) as total_profit,
        COALESCE(SUM(quantity), 0) as total_qty
      FROM (${salesQuery}) combined_sales
    `;
    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];
    
    // Paid today KPI
    const paidTodayRes = await db.query(`
      SELECT COALESCE(SUM(total_price), 0) as paid_today
      FROM (${salesQuery}) combined_today
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    res.json({
      sales: salesResult.rows,
      stats: {
        total_invoices: parseInt(stats.total_invoices || salesResult.rows.length),
        total_sales: parseFloat(stats.total_sales || 0),
        total_profit: parseFloat(stats.total_profit || 0),
        total_qty: parseInt(stats.total_qty || 0),
        paid_today: parseFloat(paidTodayRes.rows[0].paid_today || 0)
      }
    });

  } catch (error) {
    console.error('Error in billing summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all challans with optional search and pagination
router.get('/', authMiddleware(['Admin', 'Sales', 'Accounts', 'Warehouse']), async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT ch.*, COALESCE(c.name, ch.customer_name) as customer_name, u.username as created_by_name
      FROM challans ch
      LEFT JOIN customers c ON ch.customer_id = c.id
      LEFT JOIN users u ON ch.created_by = u.id
    `;
    const params = [];

    if (search) {
      query += ' WHERE ch.challan_number ILIKE $1 OR c.name ILIKE $1 OR ch.customer_name ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ` ORDER BY ch.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM challans ch
      LEFT JOIN customers c ON ch.customer_id = c.id
    `;
    const countParams = [];
    if (search) {
      countQuery += ' WHERE ch.challan_number ILIKE $1 OR c.name ILIKE $1 OR ch.customer_name ILIKE $1';
      countParams.push(`%${search}%`);
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single challan with items
router.get('/:id', authMiddleware(['Admin', 'Sales', 'Accounts', 'Warehouse']), async (req, res) => {
  try {
    const challanRes = await db.query(`
      SELECT ch.*, COALESCE(c.name, ch.customer_name) as customer_name, c.address, c.gst_number, COALESCE(c.mobile, ch.customer_mobile) as mobile
      FROM challans ch
      LEFT JOIN customers c ON ch.customer_id = c.id
      WHERE ch.id = $1
    `, [req.params.id]);

    if (challanRes.rows.length === 0) return res.status(404).json({ error: 'Challan not found' });

    const itemsRes = await db.query('SELECT * FROM challan_items WHERE challan_id = $1', [req.params.id]);
    
    res.json({
      ...challanRes.rows[0],
      items: itemsRes.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new challan / sale
router.post('/', authMiddleware(['Admin', 'Sales']), async (req, res) => {
  try {
    const { customer_id, customer_name, customer_mobile, status = 'Draft', items, sales_source = 'OFFLINE' } = req.body;
    
    if ((!customer_id && !customer_name) || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer and items are required' });
    }

    await db.query('BEGIN');

    // Generate challan number (CH-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countRes = await db.query("SELECT count(*) FROM challans WHERE DATE(created_at) = CURRENT_DATE");
    const count = parseInt(countRes.rows[0].count) + 1;
    const challan_number = `CH-${dateStr}-${count.toString().padStart(4, '0')}`;

    const total_quantity = items.reduce((sum, item) => sum + parseInt(item.quantity), 0);

    // Create challan
    const challanRes = await db.query(`
      INSERT INTO challans (challan_number, customer_id, customer_name, customer_mobile, total_quantity, sales_source, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [challan_number, customer_id || null, customer_name || null, customer_mobile || null, total_quantity, sales_source, status, req.user.id]);

    const challanId = challanRes.rows[0].id;

    // Process items
    for (let item of items) {
      // Get product details to snapshot name and price
      const productRes = await db.query('SELECT name, unit_price, current_stock FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
      if (productRes.rows.length === 0) {
        throw new Error(`Product ID ${item.product_id} not found`);
      }
      const product = productRes.rows[0];

      if (status === 'Confirmed') {
        if (product.current_stock < item.quantity) {
          await db.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: "Insufficient stock",
            product: product.name,
            available_stock: product.current_stock,
            requested_quantity: item.quantity
          });
        }
        
        // Deduct stock
        const newStock = product.current_stock - item.quantity;
        await db.query('UPDATE products SET current_stock = $1 WHERE id = $2', [newStock, item.product_id]);
        
        // Log movement
        await db.query(`
          INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, [item.product_id, item.quantity, 'OUT', `Sales Challan ${challan_number}`, req.user.id]);
      }

      await db.query(`
        INSERT INTO challan_items (challan_id, product_id, product_snapshot_name, product_snapshot_price, quantity)
        VALUES ($1, $2, $3, $4, $5)
      `, [challanId, item.product_id, product.name, product.unit_price, item.quantity]);
    }

    await db.query('COMMIT');
    
    // Trigger email if confirmed and customer has email
    if (status === 'Confirmed' && customer_id) {
      const custRes = await db.query('SELECT email, name FROM customers WHERE id = $1', [customer_id]);
      if (custRes.rows.length > 0 && custRes.rows[0].email) {
        // Build the challanData object for the email template
        const challanData = {
          challan_number: challan_number,
          created_at: new Date().toISOString(),
          items: []
        };
        
        // Re-fetch items for email
        const itemsRes = await db.query('SELECT * FROM challan_items WHERE challan_id = $1', [challanId]);
        challanData.items = itemsRes.rows;
        
        sendInvoiceEmail(custRes.rows[0].email, custRes.rows[0].name, challanData);
      }
    }

    res.status(201).json(challanRes.rows[0]);

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating challan:', error);
    res.status(400).json({ error: error.message || 'Server error' });
  }
});

// Generate challan from sales order (Warehouse -> Dispatch)
router.post('/from-order/:sales_order_id', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  const { sales_order_id } = req.params;
  
  try {
    await db.query('BEGIN');

    // Get Sales Order
    const orderRes = await db.query('SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE', [sales_order_id]);
    if (orderRes.rows.length === 0) throw new Error('Sales order not found');
    const order = orderRes.rows[0];

    if (order.status !== 'Stock Reserved') {
      throw new Error('Can only dispatch orders that have reserved stock');
    }

    // Generate challan number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countRes = await db.query("SELECT count(*) FROM challans WHERE DATE(created_at) = CURRENT_DATE");
    const count = parseInt(countRes.rows[0].count) + 1;
    const challan_number = `CH-${dateStr}-${count.toString().padStart(4, '0')}`;

    // Get order items
    const itemsRes = await db.query('SELECT * FROM sales_order_items WHERE sales_order_id = $1', [sales_order_id]);
    const items = itemsRes.rows;

    const total_quantity = items.reduce((sum, item) => sum + parseInt(item.quantity), 0);

    // Create Challan
    const challanRes = await db.query(`
      INSERT INTO challans (challan_number, sales_order_id, customer_id, customer_name, total_quantity, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [challan_number, sales_order_id, order.customer_id, order.customer_name, total_quantity, 'Dispatched', req.user.id]);
    
    const challanId = challanRes.rows[0].id;

    for (let item of items) {
      // Deduct from reserved_stock AND current_stock
      await db.query(`
        UPDATE products 
        SET reserved_stock = reserved_stock - $1, 
            current_stock = current_stock - $1 
        WHERE id = $2
      `, [item.quantity, item.product_id]);

      // Log unreserve
      await db.query(`
        INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [item.product_id, item.quantity, 'UNRESERVE', `Dispatched SO #${sales_order_id}`, req.user.id]);

      // Log out
      await db.query(`
        INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [item.product_id, item.quantity, 'OUT', `Dispatched SO #${sales_order_id}`, req.user.id]);

      // Insert challan item
      await db.query(`
        INSERT INTO challan_items (challan_id, product_id, product_snapshot_name, product_snapshot_price, quantity)
        VALUES ($1, $2, $3, $4, $5)
      `, [challanId, item.product_id, item.product_name, item.unit_price, item.quantity]);
    }

    // Update order status
    await db.query("UPDATE sales_orders SET status = 'Dispatched' WHERE id = $1", [sales_order_id]);

    await db.query('COMMIT');
    res.status(201).json({ success: true, data: challanRes.rows[0] });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error generating challan from order:', error);
    res.status(400).json({ success: false, error: error.message || 'Server error' });
  }
});

// Update status
router.put('/:id/status', authMiddleware(['Admin', 'Sales']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Draft', 'Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.query('BEGIN');
    
    const challanRes = await db.query('SELECT * FROM challans WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (challanRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Challan not found' });
    }

    const challan = challanRes.rows[0];
    
    if (challan.status === 'Confirmed' && status !== 'Confirmed') {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot change status of an already confirmed challan directly. Handle stock returns manually.' });
    }

    if (challan.status === 'Draft' && status === 'Confirmed') {
      // Need to deduct stock now
      const itemsRes = await db.query('SELECT * FROM challan_items WHERE challan_id = $1', [challan.id]);
      
      for (let item of itemsRes.rows) {
        const prodRes = await db.query('SELECT current_stock, name FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (prodRes.rows.length > 0) {
          const product = prodRes.rows[0];
          if (product.current_stock < item.quantity) {
             throw new Error(`Insufficient stock for ${product.name}`);
          }
          await db.query('UPDATE products SET current_stock = current_stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
          
          await db.query(`
            INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
            VALUES ($1, $2, $3, $4, $5)
          `, [item.product_id, item.quantity, 'OUT', `Sales Challan ${challan.challan_number}`, req.user.id]);
        }
      }
    }

    await db.query('UPDATE challans SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, challan.id]);
    await db.query('COMMIT');
    
    // Trigger email if newly confirmed and customer has email
    if (challan.status === 'Draft' && status === 'Confirmed' && challan.customer_id) {
      const custRes = await db.query('SELECT email, name FROM customers WHERE id = $1', [challan.customer_id]);
      if (custRes.rows.length > 0 && custRes.rows[0].email) {
        const challanData = {
          challan_number: challan.challan_number,
          created_at: challan.created_at,
          items: []
        };
        const itemsRes = await db.query('SELECT * FROM challan_items WHERE challan_id = $1', [challan.id]);
        challanData.items = itemsRes.rows;
        
        sendInvoiceEmail(custRes.rows[0].email, custRes.rows[0].name, challanData);
      }
    }
    
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(400).json({ error: error.message || 'Server error' });
  }
});

module.exports = router;
