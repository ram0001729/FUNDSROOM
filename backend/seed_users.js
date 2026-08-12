const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedUsers() {
  try {
    console.log('Seeding & verifying users in Neon DB...');
    const passHash = await bcrypt.hash('admin123', 10);

    const usersToUpsert = [
      { username: 'admin', email: 'admin@fundsroom.com', role: 'Admin', name: 'System Admin' },
      { username: 'sales_user', email: 'sales@fundsroom.com', role: 'Sales', name: 'Sales Manager' },
      { username: 'warehouse_user', email: 'warehouse@fundsroom.com', role: 'Warehouse', name: 'Warehouse Supervisor' },
      { username: 'accounts_user', email: 'accounts@fundsroom.com', role: 'Accounts', name: 'Accounts Manager' }
    ];

    for (const u of usersToUpsert) {
      // Check existing by username or email
      const existing = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2 OR username = $3', [u.username, u.email, u.email]);
      if (existing.rows.length > 0) {
        for (const row of existing.rows) {
          await db.query(
            'UPDATE users SET password_hash = $1, role = $2, name = $3, email = $4 WHERE id = $5',
            [passHash, u.role, u.name, u.email, row.id]
          );
          console.log(`Updated existing user ID ${row.id}: ${row.username} -> role: ${u.role}`);
        }
      } else {
        await db.query(
          'INSERT INTO users (username, password_hash, role, name, email) VALUES ($1, $2, $3, $4, $5)',
          [u.username, passHash, u.role, u.name, u.email]
        );
        console.log(`Inserted new user: ${u.username} (${u.role})`);
      }
    }

    const all = await db.query('SELECT id, username, email, role FROM users');
    console.log('ALL DB USERS NOW:', all.rows);
  } catch (err) {
    console.error('Error seeding users:', err);
  } process.exit(0);
}

seedUsers();
