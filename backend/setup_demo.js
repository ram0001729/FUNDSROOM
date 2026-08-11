const db = require('./db');
const bcrypt = require('bcryptjs');

async function setup() {
  const hash = await bcrypt.hash('admin123', 10);
  
  // Try to update if they exist
  await db.query(`UPDATE users SET password_hash = $1 WHERE username IN ('admin1', 'sales1', 'warehouse1', 'accounts1')`, [hash]);
  
  console.log('Demo accounts setup successfully with password admin123');
  process.exit();
}
setup();
