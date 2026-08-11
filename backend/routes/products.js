const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// Get all products with optional search and pagination
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products';
    const params = [];

    if (search) {
      query += ' WHERE name ILIKE $1 OR sku ILIKE $1 OR category ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM products';
    const countParams = [];
    if (search) {
      countQuery += ' WHERE name ILIKE $1 OR sku ILIKE $1 OR category ILIKE $1';
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
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product
router.post('/', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  try {
    const { name, sku, category, unit_price, cost_price, current_stock, min_stock, location, expiry_date, available, image_url } = req.body;
    if (!name || !sku || unit_price === undefined || unit_price === '') {
      return res.status(400).json({ error: 'Name, SKU, and unit_price are required' });
    }

    const query = `
      INSERT INTO products (name, sku, category, unit_price, cost_price, current_stock, min_stock, location, expiry_date, available, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
    `;
    const values = [
      name.trim(), 
      sku.trim(), 
      category ? category.trim() : 'General', 
      parseFloat(unit_price) || 0, 
      parseFloat(cost_price) || 0, 
      parseInt(current_stock) || 0, 
      parseInt(min_stock) || 10, 
      location ? location.trim() : 'Warehouse A', 
      expiry_date && expiry_date.trim() !== '' ? expiry_date : null, 
      available !== undefined ? available : true, 
      image_url || null
    ];
    const result = await db.query(query, values);

    // Log stock movement if initial stock > 0
    if (parseInt(current_stock) > 0) {
      const userId = req.user?.id || 1;
      await db.query(
        'INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) VALUES ($1, $2, $3, $4, $5)',
        [result.rows[0].id, parseInt(current_stock), 'IN', 'Initial Stock', userId]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

// Update product
router.put('/:id', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  try {
    const { name, sku, category, unit_price, cost_price, min_stock, location, expiry_date, available, image_url } = req.body;
    
    const query = `
      UPDATE products 
      SET name=$1, sku=$2, category=$3, unit_price=$4, cost_price=$5, min_stock=$6, location=$7, expiry_date=$8, available=$9, image_url=$10, updated_at=CURRENT_TIMESTAMP
      WHERE id=$11 RETURNING *
    `;
    const values = [
      name ? name.trim() : '', 
      sku ? sku.trim() : '', 
      category ? category.trim() : 'General', 
      parseFloat(unit_price) || 0, 
      parseFloat(cost_price) || 0, 
      parseInt(min_stock) || 10, 
      location ? location.trim() : 'Warehouse A', 
      expiry_date && expiry_date.trim() !== '' ? expiry_date : null, 
      available !== undefined ? available : true, 
      image_url || null, 
      req.params.id
    ];
    
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

// Bulk upload products
router.post('/bulk-upload', authMiddleware(['Admin', 'Warehouse']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Assuming Row 1 is headers (A: Name, B: Description/SKU, C: Price, D: Quantity, E: Category)
    // We will skip row 0 (headers).
    let successCount = 0;
    
    await db.query('BEGIN');

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue; // Skip empty rows

      const name = row[0];
      const sku = row[1] || `BULK-${Date.now()}-${i}`; // Fallback SKU if description is used for SKU
      const price = parseFloat(row[2]) || 0;
      const quantity = parseInt(row[3]) || 0;
      const category = row[4] || '';

      const query = `
        INSERT INTO products (name, sku, category, unit_price, current_stock)
        VALUES ($1, $2, $3, $4, $5) ON CONFLICT (sku) DO NOTHING RETURNING *
      `;
      const values = [name, sku, category, price, quantity];
      
      const resDb = await db.query(query, values);
      if (resDb.rows.length > 0) {
        successCount++;
        // Log movement if qty > 0
        if (quantity > 0) {
          await db.query(
            'INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) VALUES ($1, $2, $3, $4, $5)',
            [resDb.rows[0].id, quantity, 'IN', 'Bulk Excel Upload', req.user.id]
          );
        }
      }
    }

    await db.query('COMMIT');
    
    // Clean up uploaded file (optional, but good practice)
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({ message: `Successfully uploaded ${successCount} products` });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Server error during bulk upload' });
  }
});

// Manual Stock Adjustment
router.post('/:id/stock', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  try {
    const { quantity_changed, movement_type, reason } = req.body;
    if (!quantity_changed || !movement_type || !['IN', 'OUT'].includes(movement_type)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    await db.query('BEGIN');
    
    const productRes = await db.query('SELECT current_stock FROM products WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (productRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    let newStock = productRes.rows[0].current_stock;
    if (movement_type === 'IN') {
      newStock += parseInt(quantity_changed);
    } else {
      newStock -= parseInt(quantity_changed);
      if (newStock < 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Stock cannot go negative' });
      }
    }

    await db.query('UPDATE products SET current_stock=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [newStock, req.params.id]);
    
    await db.query(
      'INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) VALUES ($1, $2, $3, $4, $5)',
      [req.params.id, quantity_changed, movement_type, reason || 'Manual Adjustment', req.user.id]
    );

    await db.query('COMMIT');
    res.json({ message: 'Stock updated successfully', current_stock: newStock });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload Product Image using Cloudinary
const { storage } = require('../utils/cloudinary');
const cloudinaryUpload = multer({ storage });

router.post('/:id/image', authMiddleware(['Admin', 'Warehouse']), cloudinaryUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Cloudinary URL is returned in req.file.path
    const imageUrl = req.file.path;

    const result = await db.query(
      'UPDATE products SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [imageUrl, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Image uploaded successfully', image_url: imageUrl, product: result.rows[0] });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Server error during image upload' });
  }
});

// Get stock movements
router.get('/movements/log', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT sm.*, p.name as product_name, p.sku, u.username as created_by_name 
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.created_by = u.id
      ORDER BY sm.created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product details and sales history
router.get('/:id/details', authMiddleware(['Admin', 'Warehouse', 'Sales', 'Accounts']), async (req, res) => {
  try {
    const productId = req.params.id;

    // Get product info
    const productRes = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = productRes.rows[0];

    // Get sales history (who bought it)
    const salesQuery = `
      SELECT 
        ch.challan_number, 
        ch.created_at as sale_date, 
        ci.quantity,
        ci.product_snapshot_price as sold_price,
        COALESCE(c.name, ch.customer_name) as customer_name,
        COALESCE(c.business_name, '') as business_name,
        COALESCE(c.mobile, ch.customer_mobile) as mobile
      FROM challan_items ci
      JOIN challans ch ON ci.challan_id = ch.id
      LEFT JOIN customers c ON ch.customer_id = c.id
      WHERE ci.product_id = $1 AND ch.status = 'Confirmed'
      ORDER BY ch.created_at DESC
    `;
    const salesRes = await db.query(salesQuery, [productId]);
    const salesHistory = salesRes.rows;

    // Calculate total sold
    const totalSold = salesHistory.reduce((sum, record) => sum + parseInt(record.quantity), 0);

    res.json({
      product,
      total_sold: totalSold,
      sales_history: salesHistory
    });

  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
