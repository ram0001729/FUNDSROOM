const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get overall inventory stats
router.get('/stats', authMiddleware(['Admin', 'Warehouse']), async (req, res) => {
  try {
    // Total items in stock & Valuation
    const productStats = await db.query(`
      SELECT 
        SUM(current_stock) as total_items,
        SUM(current_stock * unit_price) as total_valuation,
        COUNT(CASE WHEN current_stock <= min_stock THEN 1 END) as low_stock_count
      FROM products
    `);

    // Stock movements in last 30 days
    const movementStats = await db.query(`
      SELECT 
        SUM(CASE WHEN movement_type = 'IN' THEN quantity_changed ELSE 0 END) as total_in_30d,
        SUM(CASE WHEN movement_type = 'OUT' THEN quantity_changed ELSE 0 END) as total_out_30d
      FROM stock_movements
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    res.json({
      success: true,
      data: {
        total_items: parseInt(productStats.rows[0].total_items || 0),
        total_valuation: parseFloat(productStats.rows[0].total_valuation || 0),
        low_stock_count: parseInt(productStats.rows[0].low_stock_count || 0),
        total_in_30d: parseInt(movementStats.rows[0].total_in_30d || 0),
        total_out_30d: parseInt(movementStats.rows[0].total_out_30d || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get locations overview
router.get('/locations', authMiddleware(['Admin', 'Warehouse', 'Sales', 'Accounts']), async (req, res) => {
  try {
    const locations = await db.query(`
      SELECT 
        COALESCE(location, 'Warehouse Main Zone') as location_name,
        COUNT(id) as total_products,
        COALESCE(SUM(current_stock), 0) as total_quantity,
        COALESCE(SUM(current_stock * unit_price), 0) as total_valuation,
        COUNT(CASE WHEN current_stock <= min_stock THEN 1 END) as low_stock_count
      FROM products
      GROUP BY COALESCE(location, 'Warehouse Main Zone')
      ORDER BY location_name
    `);

    // Fetch items per location
    const allProducts = await db.query(`
      SELECT id, name, sku, category, current_stock, min_stock, unit_price, COALESCE(location, 'Warehouse Main Zone') as location_name
      FROM products
      ORDER BY name ASC
    `);

    const locationMap = locations.rows.map(loc => {
      const locItems = allProducts.rows.filter(p => p.location_name === loc.location_name);
      return {
        ...loc,
        total_products: parseInt(loc.total_products || 0),
        total_quantity: parseInt(loc.total_quantity || 0),
        total_valuation: parseFloat(loc.total_valuation || 0),
        low_stock_count: parseInt(loc.low_stock_count || 0),
        items: locItems
      };
    });

    res.json({ success: true, data: locationMap });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
