const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all users
router.get('/', authMiddleware(['Admin']), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, name, mobile, role, created_at FROM users ORDER BY id ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new user (Admin action)
router.post('/', authMiddleware(['Admin']), async (req, res) => {
  const { name, email, mobile, password, role, username } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
  }

  const validRoles = ['Admin', 'Sales', 'Warehouse', 'Accounts'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const userHandle = username || email;

  try {
    // Check existing
    const checkRes = await db.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, userHandle]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email/username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, password_hash, role, name, mobile, email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, name, mobile, role, created_at`,
      [userHandle, hashedPassword, role, name, mobile || null, email]
    );

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user role
router.put('/:id/role', authMiddleware(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['Admin', 'Sales', 'Warehouse', 'Accounts'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  try {
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, name, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Role updated successfully' });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', authMiddleware(['Admin']), async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own logged-in admin account' });
  }

  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
