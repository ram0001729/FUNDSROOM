const db = require('./db');

async function seed() {
  try {
    await db.query('BEGIN');

    // 1. Clear existing data (optional, but good for clean seeding, except users)
    console.log('Clearing old data...');
    await db.query('TRUNCATE payments, invoices, challan_items, challans, sales_order_items, sales_orders, stock_movements, products, customers RESTART IDENTITY CASCADE');

    // 2. Insert Customers
    console.log('Seeding customers...');
    const custRes = await db.query(`
      INSERT INTO customers (name, mobile, email, business_name, type, address) VALUES 
      ('Rahul Sharma', '9876543210', 'rahul@example.com', 'Sharma Enterprises', 'Retail', '123 Market Rd, Mumbai'),
      ('Anita Desai', '9876543211', 'anita@example.com', 'Desai Distributors', 'Distributor', '45 Industrial Area, Pune'),
      ('Vikas Kumar', '9876543212', 'vikas@example.com', 'Kumar Retail', 'Retail', '78 Main St, Delhi')
      RETURNING id, name
    `);
    const customers = custRes.rows;

    // 3. Insert Products
    console.log('Seeding products...');
    const prodRes = await db.query(`
      INSERT INTO products (name, sku, category, unit_price, cost_price, current_stock, min_stock, location) VALUES 
      ('Premium Widget A', 'WGT-001', 'Electronics', 1500.00, 1000.00, 500, 50, 'Aisle 1'),
      ('Standard Gadget B', 'GDT-002', 'Electronics', 800.00, 500.00, 1000, 100, 'Aisle 2'),
      ('Heavy Duty Tool C', 'HTL-003', 'Hardware', 3500.00, 2500.00, 200, 20, 'Aisle 3'),
      ('Office Chair D', 'CHR-004', 'Furniture', 4500.00, 3000.00, 150, 10, 'Warehouse B')
      RETURNING id, name, unit_price
    `);
    const products = prodRes.rows;

    // 4. Initial Stock Movements
    console.log('Seeding stock movements...');
    for (const p of products) {
       await db.query(`
         INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
         VALUES ($1, $2, 'IN', 'Initial Stock Seeding', 1)
       `, [p.id, 500]); // Just a dummy log
    }

    // 5. Create a Sales Order (Created status)
    console.log('Seeding sales orders...');
    const so1 = await db.query(`
      INSERT INTO sales_orders (order_number, customer_id, customer_name, total_amount, status, created_by)
      VALUES ('SO-2026-0001', $1, $2, $3, 'Created', 1) RETURNING id
    `, [customers[0].id, customers[0].name, (products[0].unit_price * 10)]);
    
    await db.query(`
      INSERT INTO sales_order_items (sales_order_id, product_id, product_name, unit_price, quantity, total_price)
      VALUES ($1, $2, $3, $4, 10, $5)
    `, [so1.rows[0].id, products[0].id, products[0].name, products[0].unit_price, (products[0].unit_price * 10)]);

    // 6. Create a Sales Order (Stock Reserved)
    const so2 = await db.query(`
      INSERT INTO sales_orders (order_number, customer_id, customer_name, total_amount, status, created_by)
      VALUES ('SO-2026-0002', $1, $2, $3, 'Stock Reserved', 1) RETURNING id
    `, [customers[1].id, customers[1].name, (products[1].unit_price * 50)]);
    
    await db.query(`
      INSERT INTO sales_order_items (sales_order_id, product_id, product_name, unit_price, quantity, total_price)
      VALUES ($1, $2, $3, $4, 50, $5)
    `, [so2.rows[0].id, products[1].id, products[1].name, products[1].unit_price, (products[1].unit_price * 50)]);
    
    await db.query(`UPDATE products SET reserved_stock = 50 WHERE id = $1`, [products[1].id]);

    // 7. Create a Sales Order (Dispatched / Challan Created)
    const so3 = await db.query(`
      INSERT INTO sales_orders (order_number, customer_id, customer_name, total_amount, status, created_by)
      VALUES ('SO-2026-0003', $1, $2, $3, 'Dispatched', 1) RETURNING id
    `, [customers[2].id, customers[2].name, (products[2].unit_price * 5)]);
    
    await db.query(`
      INSERT INTO sales_order_items (sales_order_id, product_id, product_name, unit_price, quantity, total_price)
      VALUES ($1, $2, $3, $4, 5, $5)
    `, [so3.rows[0].id, products[2].id, products[2].name, products[2].unit_price, (products[2].unit_price * 5)]);

    const ch1 = await db.query(`
      INSERT INTO challans (challan_number, sales_order_id, customer_id, customer_name, total_quantity, status, created_by)
      VALUES ('CH-20260811-0001', $1, $2, $3, 5, 'Dispatched', 1) RETURNING id
    `, [so3.rows[0].id, customers[2].id, customers[2].name]);

    await db.query(`
      INSERT INTO challan_items (challan_id, product_id, product_snapshot_name, product_snapshot_price, quantity)
      VALUES ($1, $2, $3, $4, 5)
    `, [ch1.rows[0].id, products[2].id, products[2].name, products[2].unit_price]);

    // 8. Create a Sales Order (Invoiced & Partially Paid)
    const so4 = await db.query(`
      INSERT INTO sales_orders (order_number, customer_id, customer_name, total_amount, status, created_by)
      VALUES ('SO-2026-0004', $1, $2, $3, 'Invoiced', 1) RETURNING id
    `, [customers[0].id, customers[0].name, (products[3].unit_price * 2)]);
    
    await db.query(`
      INSERT INTO sales_order_items (sales_order_id, product_id, product_name, unit_price, quantity, total_price)
      VALUES ($1, $2, $3, $4, 2, $5)
    `, [so4.rows[0].id, products[3].id, products[3].name, products[3].unit_price, (products[3].unit_price * 2)]);

    const inv1 = await db.query(`
      INSERT INTO invoices (invoice_number, sales_order_id, customer_id, total_amount, amount_paid, status, created_by)
      VALUES ('INV-2026-0001', $1, $2, $3, $4, 'Partial', 1) RETURNING id
    `, [so4.rows[0].id, customers[0].id, (products[3].unit_price * 2), 5000]);

    await db.query(`
      INSERT INTO payments (payment_number, invoice_id, customer_id, amount, payment_method, notes, created_by)
      VALUES ('PAY-2026-0001', $1, $2, 5000, 'Bank Transfer', 'Advance payment', 1)
    `, [inv1.rows[0].id, customers[0].id]);

    await db.query('COMMIT');
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
