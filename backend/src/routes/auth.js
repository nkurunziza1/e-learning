import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'trainee') RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), hash]
    );
    const u = r.rows[0];
    const token = jwt.sign(
      { id: u.id, email: u.email, role: u.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ user: u, token });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const r = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [
    email.trim().toLowerCase(),
  ]);
  if (r.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const u = r.rows[0];
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  res.json({
    user: { id: u.id, name: u.name, email: u.email, role: u.role },
    token,
  });
});

router.get('/me', authRequired, async (req, res) => {
  const r = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
  if (r.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(r.rows[0]);
});

export default router;
