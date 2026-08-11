const db = require('./db');
async function run() {
  await db.query(`UPDATE products SET image_url = '/uploads/widget.jpg'`);
  console.log('Updated');
  process.exit();
}
run();
