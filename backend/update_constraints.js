const db = require('./db');

async function update() {
  const q = `
    ALTER TABLE challans DROP CONSTRAINT IF EXISTS challans_status_check; 
    ALTER TABLE challans ADD CONSTRAINT challans_status_check CHECK (status IN ('Draft', 'Confirmed', 'Dispatched', 'Cancelled')); 
    
    ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check; 
    ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_movement_type_check CHECK (movement_type IN ('IN', 'OUT', 'RESERVE', 'UNRESERVE'));
    
    ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check; 
    ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check CHECK (status IN ('Created', 'Stock Reserved', 'Dispatched', 'Delivered', 'Invoiced', 'Paid', 'Cancelled'));
  `;
  try {
    await db.query(q);
    console.log('Constraints updated successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
update();
