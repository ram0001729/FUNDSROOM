const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://neondb_owner:npg_Fxlm06CaVToJ@ep-noisy-recipe-ayfrrwag-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

async function seedUsers() {
  const client = await pool.connect();
  try {
    console.log('Seeding and verifying users in Neon DB...');
    const passHash = await bcrypt.hash('admin123', 10);

    const usersToUpsert = [
      { username: 'admin', email: 'admin@fundsroom.com', role: 'Admin', name: 'System Admin' },
      { username: 'sales_user', email: 'sales@fundsroom.com', role: 'Sales', name: 'Sales Manager' },
      { username: 'warehouse_user', email: 'warehouse@fundsroom.com', role: 'Warehouse', name: 'Warehouse Supervisor' },
      { username: 'accounts_user', email: 'accounts@fundsroom.com', role: 'Accounts', name: 'Accounts Manager' }
    ];

    for (const u of usersToUpsert) {
      // Upsert by username
      const existing = await client.query('SELECT * FROM users WHERE username = $1 OR email = $2', [u.username, u.email]);
      if (existing.rows.length > 0) {
        await client.query(
          'UPDATE users SET password_hash = $1, role = $2, name = $3, email = $4 WHERE id = $5',
          [passHash, u.role, u.name, u.email, existing.rows[0].id]
        );
        console.log(`Updated user: ${u.username} (${u.role})`);
      } else {
        await client.query(
          'INSERT INTO users (username, password_hash, role, name, email) VALUES ($1, $2, $3, $4, $5)',
          [u.username, passHash, u.role, u.name, u.email]
        );
        console.log(`Created user: ${u.username} (${u.role})`);
      }
    }

    const all = await client.query('SELECT id, username, email, role FROM users');
    console.log('ALL DB USERS NOW:', all.rows);
  } catch (err) {
    console.error('Error seeding users:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seedUsers();
