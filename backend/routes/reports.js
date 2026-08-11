const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get 30-day reports summary and growth
router.get('/', authMiddleware(['Admin', 'Sales', 'Accounts']), async (req, res) => {
  try {
    // Current 30 days
    const currentStatsQuery = `
      SELECT 
        COUNT(DISTINCT ch.id) as total_orders,
        SUM(ci.quantity * ci.product_snapshot_price) as total_sales,
        SUM(ci.quantity * (ci.product_snapshot_price - COALESCE(p.cost_price, 0))) as total_profit
      FROM challan_items ci
      JOIN challans ch ON ci.challan_id = ch.id
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ch.status = 'Confirmed' 
        AND ch.created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    const currentStatsResult = await db.query(currentStatsQuery);
    const current = currentStatsResult.rows[0];

    // Previous 30 days (for growth)
    const prevStatsQuery = `
      SELECT 
        SUM(ci.quantity * ci.product_snapshot_price) as total_sales,
        SUM(ci.quantity * (ci.product_snapshot_price - COALESCE(p.cost_price, 0))) as total_profit
      FROM challan_items ci
      JOIN challans ch ON ci.challan_id = ch.id
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ch.status = 'Confirmed' 
        AND ch.created_at >= CURRENT_DATE - INTERVAL '60 days'
        AND ch.created_at < CURRENT_DATE - INTERVAL '30 days'
    `;
    const prevStatsResult = await db.query(prevStatsQuery);
    const prev = prevStatsResult.rows[0];

    // Calculate Growth %
    const calculateGrowth = (curr, prev) => {
      const c = parseFloat(curr) || 0;
      const p = parseFloat(prev) || 0;
      if (p === 0) return c > 0 ? 100 : 0;
      return ((c - p) / p) * 100;
    };

    const growth_sales_30d = calculateGrowth(current.total_sales, prev.total_sales);
    const growth_profit_30d = calculateGrowth(current.total_profit, prev.total_profit);
    const total_orders = parseInt(current.total_orders) || 0;
    const total_sales = parseFloat(current.total_sales) || 0;
    const avg_order_value = total_orders > 0 ? total_sales / total_orders : 0;

    // Top Products
    const topProductsQuery = `
      SELECT 
        p.name as product_name,
        p.category,
        SUM(ci.quantity) as quantity,
        SUM(ci.quantity * ci.product_snapshot_price) as amount,
        SUM(ci.quantity * (ci.product_snapshot_price - COALESCE(p.cost_price, 0))) as profit
      FROM challan_items ci
      JOIN challans ch ON ci.challan_id = ch.id
      JOIN products p ON ci.product_id = p.id
      WHERE ch.status = 'Confirmed' 
        AND ch.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.id, p.name, p.category
      ORDER BY amount DESC
      LIMIT 10
    `;
    const topProductsResult = await db.query(topProductsQuery);

    // Sales Trend (Last 6 months grouped by month)
    const trendQuery = `
      SELECT 
        TO_CHAR(ch.created_at, 'Mon YYYY') as month_label,
        DATE_TRUNC('month', ch.created_at) as month_date,
        SUM(ci.quantity * ci.product_snapshot_price) as sales,
        SUM(ci.quantity * (ci.product_snapshot_price - COALESCE(p.cost_price, 0))) as profit,
        COUNT(DISTINCT ch.id) as orders
      FROM challan_items ci
      JOIN challans ch ON ci.challan_id = ch.id
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ch.status = 'Confirmed' 
        AND ch.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY month_label, month_date
      ORDER BY month_date ASC
    `;
    const trendResult = await db.query(trendQuery);

    const month_labels = trendResult.rows.map(r => r.month_label);
    const month_sales = trendResult.rows.map(r => parseFloat(r.sales) || 0);
    const month_profit = trendResult.rows.map(r => parseFloat(r.profit) || 0);
    const month_orders = trendResult.rows.map(r => parseInt(r.orders) || 0);

    // Predictive Analytics
    const predictiveQuery = `
      SELECT 
        p.id,
        p.name as product_name,
        p.current_stock,
        COALESCE(SUM(sm.quantity_changed), 0) as total_sold_30d
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id 
        AND sm.movement_type = 'OUT' 
        AND sm.created_at >= CURRENT_DATE - INTERVAL '30 days'
      WHERE p.available = true AND p.current_stock > 0
      GROUP BY p.id, p.name, p.current_stock
    `;
    const predictiveResult = await db.query(predictiveQuery);
    
    const predictive_alerts = [];
    predictiveResult.rows.forEach(row => {
      const sold30d = parseInt(row.total_sold_30d) || 0;
      const dailyVelocity = sold30d / 30;
      if (dailyVelocity > 0) {
        const daysRemaining = Math.floor(row.current_stock / dailyVelocity);
        if (daysRemaining <= 14) {
          predictive_alerts.push({
            product_name: row.product_name,
            current_stock: row.current_stock,
            daily_velocity: dailyVelocity.toFixed(1),
            days_remaining: daysRemaining
          });
        }
      }
    });
    
    predictive_alerts.sort((a, b) => a.days_remaining - b.days_remaining);

    // Accounts Dashboard Stats
    const accountsStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM invoices) as total_invoices,
        (SELECT SUM(amount) FROM payments) as payments_received,
        (SELECT COUNT(*) FROM invoices WHERE status = 'Overdue') as overdue_invoices,
        (SELECT SUM(total_amount - amount_paid) FROM invoices WHERE status IN ('Pending', 'Overdue')) as outstanding_balance
    `;
    const accountsStatsResult = await db.query(accountsStatsQuery);
    const accounts = accountsStatsResult.rows[0];

    // Overall Business Stats
    const overallStatsResult = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM sales_orders) as total_sales_orders,
        (SELECT COUNT(*) FROM challans WHERE status = 'Confirmed') as total_challans_confirmed,
        (SELECT COALESCE(SUM(total_amount),0) FROM sales_orders) as total_revenue_all_time,
        (SELECT COUNT(*) FROM products WHERE available = true) as total_active_products,
        (SELECT COUNT(*) FROM customers WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_customers_30d,
        (SELECT COUNT(*) FROM sales_orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as orders_this_week,
        (SELECT COALESCE(SUM(total_amount),0) FROM sales_orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as revenue_this_week
    `);
    const overall = overallStatsResult.rows[0];

    // Sales Dashboard Stats (with Daily Trend)
    const salesStatsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM customers WHERE status = 'Lead' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as new_leads,
        (SELECT COUNT(*) FROM customers WHERE follow_up_date::date = CURRENT_DATE) as follow_ups_today,
        (SELECT COUNT(*) FROM sales_orders WHERE status = 'Created') as pending_orders,
        (SELECT COUNT(*) FROM sales_orders WHERE created_at >= CURRENT_DATE) as orders_today,
        (SELECT COALESCE(SUM(total_amount),0) FROM sales_orders WHERE created_at >= CURRENT_DATE) as revenue_today
    `);
    const salesDash = salesStatsResult.rows[0];

    // Daily Sales Trend (Last 14 days)
    const dailySalesQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('day', d.day), 'DD Mon') as day_label,
        COALESCE(SUM(so.total_amount), 0) as sales,
        COUNT(so.id) as orders
      FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval) d(day)
      LEFT JOIN sales_orders so ON DATE_TRUNC('day', so.created_at) = d.day
      GROUP BY d.day, day_label
      ORDER BY d.day ASC
    `;
    const dailySalesResult = await db.query(dailySalesQuery);
    
    salesDash.daily_trend = {
      labels: dailySalesResult.rows.map(r => r.day_label),
      sales: dailySalesResult.rows.map(r => parseFloat(r.sales) || 0),
      orders: dailySalesResult.rows.map(r => parseInt(r.orders) || 0)
    };

    // Warehouse Dashboard Stats
    const warehouseStatsResult = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM sales_orders WHERE status = 'Stock Reserved') as pending_dispatches
    `);
    const warehouseDash = warehouseStatsResult.rows[0];

    res.json({
      stats: {
        total_sales,
        total_profit: parseFloat(current.total_profit) || 0,
        total_orders,
        avg_order_value,
        growth_sales_30d,
        growth_profit_30d
      },
      summary_30d: {
        products: topProductsResult.rows.map(p => ({
          ...p,
          quantity: parseInt(p.quantity),
          amount: parseFloat(p.amount),
          profit: parseFloat(p.profit)
        }))
      },
      chart: {
        month_labels,
        month_sales,
        month_profit,
        month_orders
      },
      predictive_alerts,
      accounts_stats: {
        total_invoices: parseInt(accounts.total_invoices) || 0,
        payments_received: parseFloat(accounts.payments_received) || 0,
        overdue_invoices: parseInt(accounts.overdue_invoices) || 0,
        outstanding_balance: parseFloat(accounts.outstanding_balance) || 0
      },
      sales_dashboard_stats: {
        new_leads: parseInt(salesDash.new_leads) || 0,
        follow_ups_today: parseInt(salesDash.follow_ups_today) || 0,
        pending_orders: parseInt(salesDash.pending_orders) || 0,
        orders_today: parseInt(salesDash.orders_today) || 0,
        revenue_today: parseFloat(salesDash.revenue_today) || 0
      },
      warehouse_dashboard_stats: {
        total_products: parseInt(warehouseDash.total_products) || 0,
        pending_dispatches: parseInt(warehouseDash.pending_dispatches) || 0
      },
      overall_stats: {
        total_customers: parseInt(overall.total_customers) || 0,
        total_sales_orders: parseInt(overall.total_sales_orders) || 0,
        total_challans_confirmed: parseInt(overall.total_challans_confirmed) || 0,
        total_revenue_all_time: parseFloat(overall.total_revenue_all_time) || 0,
        total_active_products: parseInt(overall.total_active_products) || 0,
        new_customers_30d: parseInt(overall.new_customers_30d) || 0,
        orders_this_week: parseInt(overall.orders_this_week) || 0,
        revenue_this_week: parseFloat(overall.revenue_this_week) || 0
      }
    });

  } catch (error) {
    console.error('Error in reports:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
