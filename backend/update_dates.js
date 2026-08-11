const db = require('C:/Users/mekal/OneDrive/Documents/InfoTech/backend/db.js');

async function updateDates() {
  try {
    // 1 challan from today (already is)
    // 1 challan from 10 days ago (This month, but not today)
    await db.query(`
      UPDATE challans 
      SET created_at = CURRENT_DATE - INTERVAL '10 days'
      WHERE challan_number = 'CH-2026-002'
    `);
    
    // 1 challan from 3 months ago (Last 6 months, but not this month)
    await db.query(`
      UPDATE challans 
      SET created_at = CURRENT_DATE - INTERVAL '3 months'
      WHERE challan_number = 'CH-2026-003'
    `);

    // Let's do the same for invoices and payments so that reports are varied too
    await db.query(`
      UPDATE invoices
      SET created_at = CURRENT_DATE - INTERVAL '10 days'
      WHERE invoice_number LIKE '%-0002%'
    `);
    
    await db.query(`
      UPDATE invoices
      SET created_at = CURRENT_DATE - INTERVAL '3 months'
      WHERE invoice_number LIKE '%-0003%'
    `);

    console.log('Dates updated successfully to simulate history.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDates();
