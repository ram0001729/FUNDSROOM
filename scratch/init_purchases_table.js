const pool = require('../backend/db');

async function initPurchasesTable() {
  const client = await pool.connect();
  try {
    console.log('Creating purchase_orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_name VARCHAR(150) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT,
        created_by INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Creating purchase_order_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id SERIAL PRIMARY KEY,
        purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id),
        product_name VARCHAR(150),
        unit_price DECIMAL(10, 2),
        quantity INT NOT NULL,
        total_price DECIMAL(12, 2)
      );
    `);

    // Check existing count
    const countRes = await client.query('SELECT COUNT(*) FROM purchase_orders');
    if (parseInt(countRes.rows[0].count) === 0) {
      console.log('Seeding initial purchase orders...');
      // Get an admin user id and product id
      const adminRes = await client.query("SELECT id FROM users WHERE role = 'Admin' LIMIT 1");
      const adminId = adminRes.rows[0]?.id || 1;
      
      const prodRes = await client.query("SELECT id, name, cost_price, unit_price FROM products LIMIT 3");
      const prods = prodRes.rows;

      if (prods.length > 0) {
        // PO 1
        const po1 = await client.query(`
          INSERT INTO purchase_orders (po_number, supplier_name, total_amount, status, created_by)
          VALUES ('PO-2026-0001', 'UltraTech Building Supplies Ltd', $1, 'Pending', $2) RETURNING id
        `, [parseFloat(prods[0].cost_price || prods[0].unit_price) * 100, adminId]);

        await client.query(`
          INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, unit_price, quantity, total_price)
          VALUES ($1, $2, $3, $4, 100, $5)
        `, [po1.rows[0].id, prods[0].id, prods[0].name, prods[0].cost_price || prods[0].unit_price, parseFloat(prods[0].cost_price || prods[0].unit_price) * 100]);

        // PO 2
        const po2 = await client.query(`
          INSERT INTO purchase_orders (po_number, supplier_name, total_amount, status, created_by)
          VALUES ('PO-2026-0002', 'Tata Steel & Metals Corp', $1, 'Received', $2) RETURNING id
        `, [parseFloat(prods[1]?.cost_price || prods[0].unit_price) * 50, adminId]);

        await client.query(`
          INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, unit_price, quantity, total_price)
          VALUES ($1, $2, $3, $4, 50, $5)
        `, [po2.rows[0].id, prods[1]?.id || prods[0].id, prods[1]?.name || prods[0].name, prods[1]?.cost_price || prods[0].unit_price, parseFloat(prods[1]?.cost_price || prods[0].unit_price) * 50]);

        console.log('Seeded 2 purchase orders successfully');
      }
    }

    console.log('Purchases tables initialized successfully!');
  } catch (err) {
    console.error('Error initializing purchases tables:', err);
  } finally {
    client.release();
    process.exit();
  }
}

initPurchasesTable();
