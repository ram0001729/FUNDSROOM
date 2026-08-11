const pool = require('../backend/db');

async function seedRichDatabaseData() {
  const client = await pool.connect();
  try {
    console.log('Migrating sales_orders schema & seeding rich 6-month dynamic data...');

    await client.query(`
      ALTER TABLE sales_orders 
      ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'OFFLINE';
    `);

    // 1. Ensure Products Exist
    const productsRes = await client.query('SELECT id, name, unit_price, cost_price, current_stock FROM products ORDER BY id ASC');
    if (productsRes.rows.length === 0) {
      console.log('No products found to seed orders.');
      return;
    }
    const products = productsRes.rows;

    // 2. Ensure Customers Exist
    const customersRes = await client.query('SELECT id, name FROM customers ORDER BY id ASC');
    if (customersRes.rows.length === 0) {
      console.log('No customers found to seed orders.');
      return;
    }
    const customers = customersRes.rows;

    // Dates for the last 6 months
    const months = [5, 4, 3, 2, 1, 0];

    for (const m of months) {
      const monthOffset = m;
      const orderCount = Math.floor(Math.random() * 4) + 3;

      for (let i = 0; i < orderCount; i++) {
        const product = products[i % products.length];
        const customer = customers[i % customers.length];
        const qty = Math.floor(Math.random() * 20) + 5;
        const totalAmount = qty * parseFloat(product.unit_price || 100);
        const orderNum = `SO-2026-M${m}-${i + 100}`;
        const source = i % 2 === 0 ? 'ONLINE' : 'OFFLINE';
        const orderStatus = i % 3 === 0 ? 'Created' : i % 3 === 1 ? 'Dispatched' : 'Delivered';

        const createdDate = new Date();
        createdDate.setMonth(createdDate.getMonth() - monthOffset);
        createdDate.setDate(Math.floor(Math.random() * 20) + 1);

        // Insert Sales Order
        const soRes = await client.query(`
          INSERT INTO sales_orders (order_number, customer_id, customer_name, total_amount, status, source, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
          ON CONFLICT (order_number) DO NOTHING
          RETURNING id
        `, [orderNum, customer.id, customer.name, totalAmount, orderStatus, source, createdDate]);

        if (soRes.rows.length > 0) {
          const orderId = soRes.rows[0].id;
          await client.query(`
            INSERT INTO sales_order_items (sales_order_id, product_id, product_name, quantity, unit_price, total_price)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [orderId, product.id, product.name, qty, product.unit_price, totalAmount]);

          // Insert Challan
          const challanNum = `DC-2026-M${m}-${i + 100}`;
          const chRes = await client.query(`
            INSERT INTO challans (challan_number, sales_order_id, customer_name, total_quantity, status, created_at)
            VALUES ($1, $2, $3, $4, 'Confirmed', $5)
            ON CONFLICT (challan_number) DO NOTHING
            RETURNING id
          `, [challanNum, orderId, customer.name, qty, createdDate]);

          if (chRes.rows.length > 0) {
            const challanId = chRes.rows[0].id;
            await client.query(`
              INSERT INTO challan_items (challan_id, product_id, quantity, product_snapshot_name, product_snapshot_price)
              VALUES ($1, $2, $3, $4, $5)
            `, [challanId, product.id, qty, product.name, product.unit_price]);
          }

          // Insert Invoice
          const invNum = `INV-2026-M${m}-${i + 100}`;
          await client.query(`
            INSERT INTO invoices (invoice_number, sales_order_id, total_amount, amount_paid, status, created_at)
            VALUES ($1, $2, $3, $4, 'Paid', $5)
            ON CONFLICT (invoice_number) DO NOTHING
          `, [invNum, orderId, totalAmount, totalAmount, createdDate]);

          // Insert Stock Movement
          await client.query(`
            INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by, created_at)
            VALUES ($1, $2, 'OUT', $3, 1, $4)
          `, [product.id, qty, `Sales Order ${orderNum}`, createdDate]);
        }
      }
    }

    console.log('Rich dynamic database seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding rich database:', err);
  } finally {
    client.release();
    process.exit();
  }
}

seedRichDatabaseData();
