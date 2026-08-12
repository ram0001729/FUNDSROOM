const db = require('./db');

async function testChallan() {
  try {
    const customer = await db.query('SELECT id FROM customers LIMIT 1');
    const product = await db.query('SELECT id, name, unit_price, current_stock FROM products LIMIT 1');
    
    if (customer.rows.length === 0 || product.rows.length === 0) {
      console.log("Need customer and product");
      return;
    }

    const item = product.rows[0];
    const items = [{ product_id: item.id, quantity: 1 }];
    const customer_id = customer.rows[0].id;
    const status = 'Confirmed';
    const sales_source = 'OFFLINE';
    
    await db.query('BEGIN');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countRes = await db.query("SELECT count(*) FROM challans WHERE DATE(created_at) = CURRENT_DATE");
    const count = parseInt(countRes.rows[0].count) + 1;
    const challan_number = `CH-${dateStr}-${count.toString().padStart(4, '0')}`;

    console.log("Inserting challan:", challan_number);

    const challanRes = await db.query(`
      INSERT INTO challans (challan_number, customer_id, customer_name, customer_mobile, total_quantity, sales_source, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [challan_number, customer_id, null, null, 1, sales_source, status, 1]);

    const challanId = challanRes.rows[0].id;

    for (let it of items) {
      const productRes = await db.query('SELECT name, unit_price, current_stock FROM products WHERE id = $1 FOR UPDATE', [it.product_id]);
      const p = productRes.rows[0];

      if (status === 'Confirmed') {
        if (p.current_stock < it.quantity) {
          throw new Error("Insufficient stock");
        }
        
        const newStock = p.current_stock - it.quantity;
        await db.query('UPDATE products SET current_stock = $1 WHERE id = $2', [newStock, it.product_id]);
        
        await db.query(`
          INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, [it.product_id, it.quantity, 'OUT', `Sales Challan ${challan_number}`, 1]);
      }

      await db.query(`
        INSERT INTO challan_items (challan_id, product_id, product_snapshot_name, product_snapshot_price, quantity)
        VALUES ($1, $2, $3, $4, $5)
      `, [challanId, it.product_id, p.name, p.unit_price, it.quantity]);
    }

    await db.query('ROLLBACK');
    console.log("Success with Confirmed status");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}
testChallan();
