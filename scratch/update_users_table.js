const pool = require('../backend/db');

async function updateUsersTable() {
  const client = await pool.connect();
  try {
    console.log('Adding name, email, mobile, updated_at columns to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS email VARCHAR(150),
      ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Populate default names/emails for existing users
    await client.query("UPDATE users SET name = 'Administrator', email = 'admin@fundsroom.com' WHERE username = 'admin' AND email IS NULL");
    await client.query("UPDATE users SET name = 'Sales Executive', email = 'sales@fundsroom.com' WHERE username = 'sales_user' AND email IS NULL");
    await client.query("UPDATE users SET name = 'Warehouse Manager', email = 'warehouse@fundsroom.com' WHERE username = 'warehouse_user' AND email IS NULL");
    await client.query("UPDATE users SET name = 'Accounts Manager', email = 'accounts@fundsroom.com' WHERE username = 'accounts_user' AND email IS NULL");

    console.log('Users table schema updated successfully!');
  } catch (err) {
    console.error('Error updating users table:', err);
  } finally {
    client.release();
    process.exit();
  }
}

updateUsersTable();
