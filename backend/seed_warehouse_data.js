const db = require('./db');

async function seedWarehouseData() {
  try {
    console.log('Seeding rich warehouse inventory and movement data into Neon DB...');

    // 1. Assign diverse, realistic warehouse locations to products
    const locations = [
      'Warehouse North Wing - Aisle 1',
      'Warehouse East Wing - Aisle 2',
      'Central Logistics Hub - Section B',
      'Cold Storage Facility - Unit 4',
      'Distribution Center South - Bay 3',
      'Raw Material Depot - Rack 5',
      'Main Fulfillment Warehouse - Zone A'
    ];

    const prodRes = await db.query('SELECT id, name, current_stock FROM products');
    const products = prodRes.rows;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const loc = locations[i % locations.length];
      await db.query('UPDATE products SET location = $1 WHERE id = $2', [loc, p.id]);
    }
    console.log(`Updated locations for ${products.length} products.`);

    // 2. Seed realistic stock movements over the last 6 months
    console.log('Seeding stock movements history...');
    
    // Clear existing stock movements
    await db.query('TRUNCATE stock_movements RESTART IDENTITY CASCADE');

    const movementTypes = ['IN', 'OUT'];
    const reasonsIN = [
      'Supplier Delivery',
      'Initial Stock Count',
      'Purchase Order Receipt',
      'Inter-Warehouse Transfer IN',
      'Customer Product Return'
    ];
    const reasonsOUT = [
      'Sales Order Dispatch',
      'Wholesale Delivery Outbound',
      'Damaged Stock Write-off',
      'Inter-Warehouse Transfer OUT',
      'Sample Allocation'
    ];

    const usersRes = await db.query('SELECT id FROM users LIMIT 5');
    const userIds = usersRes.rows.map(u => u.id);
    const fallbackUserId = userIds.length > 0 ? userIds[0] : 1;

    let movementCount = 0;
    const now = new Date();

    for (const p of products) {
      // Create 5-10 historical stock movements per product
      const numMovements = Math.floor(Math.random() * 6) + 5;
      
      for (let m = 0; m < numMovements; m++) {
        const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
        const qty = Math.floor(Math.random() * 50) + 5;
        const reasonList = type === 'IN' ? reasonsIN : reasonsOUT;
        const reason = reasonList[Math.floor(Math.random() * reasonList.length)];
        
        // Random date within last 180 days
        const daysAgo = Math.floor(Math.random() * 180);
        const movementDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const userId = userIds[Math.floor(Math.random() * userIds.length)] || fallbackUserId;

        await db.query(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [p.id, qty, type, reason, userId, movementDate]
        );
        movementCount++;
      }
    }
    console.log(`Seeded ${movementCount} historical stock movement records.`);

    // 3. Verify Summary
    const locSummary = await db.query(`
      SELECT location, COUNT(*) as product_count, SUM(current_stock) as total_stock
      FROM products
      GROUP BY location
    `);
    console.log('WAREHOUSE LOCATION SUMMARY:', locSummary.rows);

  } catch (err) {
    console.error('Error seeding warehouse data:', err);
  } finally {
    process.exit(0);
  }
}

seedWarehouseData();
