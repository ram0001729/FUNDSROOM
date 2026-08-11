require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        store_name VARCHAR(255) DEFAULT 'ShopKeeper',
        store_address TEXT,
        gst_number VARCHAR(100),
        currency VARCHAR(10) DEFAULT 'INR',
        tax_rate DECIMAL(5,2) DEFAULT 0,
        email VARCHAR(255),
        phone VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const res = await pool.query('SELECT COUNT(*) FROM settings');
    if(parseInt(res.rows[0].count) === 0) {
      await pool.query("INSERT INTO settings (store_name) VALUES ('ShopKeeper')");
    }
    console.log('Settings table ready');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
