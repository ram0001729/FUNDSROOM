const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all payments
router.get('/', authMiddleware(['Admin', 'Sales', 'Accounts']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, i.invoice_number, c.name as customer_name 
       FROM payments p 
       LEFT JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN customers c ON p.customer_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Record a Payment (Accounts)
router.post('/', authMiddleware(['Admin', 'Accounts']), async (req, res) => {
  const { invoice_id, amount, payment_method, reference_number, notes } = req.body;
  
  if (!invoice_id || !amount) {
    return res.status(400).json({ success: false, message: 'Invoice ID and amount are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get Invoice
    const invoiceRes = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [invoice_id]);
    if (invoiceRes.rows.length === 0) throw new Error('Invoice not found');
    const invoice = invoiceRes.rows[0];

    const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(amount);
    if (newAmountPaid > invoice.total_amount) {
       throw new Error('Payment amount exceeds total invoice amount');
    }

    let newStatus = 'Partial';
    if (newAmountPaid === parseFloat(invoice.total_amount)) {
       newStatus = 'Paid';
    }

    // Generate Payment Number
    const countResult = await client.query('SELECT COUNT(*) FROM payments');
    const payNumber = `PAY-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

    // Create Payment record
    const paymentRes = await client.query(
      `INSERT INTO payments (payment_number, invoice_id, customer_id, amount, payment_method, reference_number, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [payNumber, invoice_id, invoice.customer_id, amount, payment_method, reference_number, notes, req.user.id]
    );

    // Update Invoice
    await client.query(
      `UPDATE invoices SET amount_paid = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [newAmountPaid, newStatus, invoice_id]
    );

    // If fully paid, update sales order status
    if (newStatus === 'Paid' && invoice.sales_order_id) {
       await client.query("UPDATE sales_orders SET status = 'Paid' WHERE id = $1", [invoice.sales_order_id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: paymentRes.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording payment:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
