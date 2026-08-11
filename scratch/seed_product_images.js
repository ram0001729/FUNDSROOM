const pool = require('../backend/db');

const images = {
  'Ultra Cement 50kg': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  'Steel TMT Bar 12mm': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  'Premium Emulsion Paint': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
  'Red Clay Bricks (1000 Pcs)': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'PVC Pipe 4 Inch': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80'
};

async function seedImages() {
  const client = await pool.connect();
  try {
    for (const [name, url] of Object.entries(images)) {
      await client.query('UPDATE products SET image_url = $1 WHERE name = $2', [url, name]);
      console.log(`Updated image for ${name}`);
    }
    
    // Set fallback image for any remaining products with null image_url
    await client.query(`
      UPDATE products 
      SET image_url = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80' 
      WHERE image_url IS NULL
    `);
    console.log('Seeded fallback images for remaining products');
  } catch (err) {
    console.error('Error seeding images:', err);
  } finally {
    client.release();
    process.exit();
  }
}

seedImages();
