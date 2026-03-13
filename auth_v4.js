// E:\Pothosense\backend\routes\auth.js   v4 (Citizen / Staff / Supervisor)
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const auth    = require('../middleware/auth');

const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// 
//  CITIZEN
// 
router.post('/citizen/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO citizens (username, email, password_hash) VALUES (?,?,?)', [username, email, hash]);
    res.status(201).json({ message: 'Account created successfully' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/citizen/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM citizens WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    if (!await bcrypt.compare(password, rows[0].password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: sign({ id: rows[0].id, role: 'citizen' }), username: rows[0].username });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/citizen/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const [rows] = await db.query('SELECT id FROM citizens WHERE email = ?', [email]);
    if (!rows.length) return res.status(404).json({ error: 'No account with that email' });
    const otp  = Math.floor(1000 + Math.random() * 9000).toString();
    const exp  = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('UPDATE citizens SET otp_code=?, otp_expires=? WHERE email=?', [otp, exp, email]);
    console.log(`[OTP] Citizen ${email}: ${otp}`);
    res.json({ message: 'OTP sent to your email' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/citizen/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password) return res.status(400).json({ error: 'All fields required' });
  try {
    const [rows] = await db.query('SELECT * FROM citizens WHERE email = ? AND otp_code = ? AND otp_expires > NOW()', [email, otp]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE citizens SET password_hash=?, otp_code=NULL, otp_expires=NULL WHERE email=?', [hash, email]);
    res.json({ message: 'Password reset successfully' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// 
//  STAFF  (registers with supervisor's admin_key)
// 
router.post('/staff/register', async (req, res) => {
  const { name, employee_id, email, password, zone, admin_key } = req.body;
  if (!name || !employee_id || !password || !admin_key)
    return res.status(400).json({ error: 'name, employee_id, password, admin_key required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    // Look up which supervisor owns this admin_key
    const [supRows] = await db.query('SELECT id, name, zone FROM supervisors WHERE admin_key = ? AND is_active = 1', [admin_key]);
    if (!supRows.length) return res.status(403).json({ error: 'Invalid admin key. Contact your supervisor.' });
    const sup = supRows[0];

    // Enforce max 10 staff per supervisor
    const [countRows] = await db.query('SELECT COUNT(*) AS cnt FROM staff WHERE supervisor_id = ? AND is_active = 1', [sup.id]);
    if (countRows[0].cnt >= 10) return res.status(403).json({ error: 'This supervisor already has 10 staff members.' });

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO staff (name, employee_id, email, password_hash, zone, supervisor_id) VALUES (?,?,?,?,?,?)',
      [name, employee_id, email || null, hash, zone || sup.zone, sup.id]
    );
    res.status(201).json({ message: `Staff account created under supervisor ${sup.name}` });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Employee ID or email already exists' });
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.post('/staff/login', async (req, res) => {
  const { employee_id, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM staff WHERE employee_id = ? AND is_active = 1', [employee_id]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    if (!await bcrypt.compare(password, rows[0].password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    const s = rows[0];
    res.json({
      token: sign({ id: s.id, role: 'staff', zone: s.zone, name: s.name, supervisor_id: s.supervisor_id }),
      name: s.name, zone: s.zone, employee_id: s.employee_id, supervisor_id: s.supervisor_id
    });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/staff/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const [rows] = await db.query('SELECT id FROM staff WHERE email = ? AND is_active = 1', [email]);
    if (!rows.length) return res.status(404).json({ error: 'No staff account with that email' });
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const exp = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('UPDATE staff SET otp_code=?, otp_expires=? WHERE email=?', [otp, exp, email]);
    console.log(`[OTP] Staff ${email}: ${otp}`);
    res.json({ message: 'OTP sent to your email' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/staff/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM staff WHERE email=? AND otp_code=? AND otp_expires > NOW()', [email, otp]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE staff SET password_hash=?, otp_code=NULL, otp_expires=NULL WHERE email=?', [hash, email]);
    res.json({ message: 'Password reset successfully' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// 
//  SUPERVISOR
// 
router.post('/supervisor/register', async (req, res) => {
  // Supervisor registration requires the global ADMIN_KEY from .env
  const { name, employee_id, email, password, zone, admin_key } = req.body;
  if (admin_key !== (process.env.ADMIN_KEY || 'POTHOSENSE_ADMIN_2024'))
    return res.status(403).json({ error: 'Invalid global admin key' });
  if (!name || !employee_id || !password) return res.status(400).json({ error: 'name, employee_id, password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const hash = await bcrypt.hash(password, 10);
    // Auto-generate a unique supervisor admin_key
    const supKey = `SUP_${employee_id.toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;
    await db.query(
      'INSERT INTO supervisors (name, employee_id, email, password_hash, zone, admin_key) VALUES (?,?,?,?,?,?)',
      [name, employee_id, email || null, hash, zone || null, supKey]
    );
    res.status(201).json({ message: 'Supervisor account created', your_admin_key: supKey });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Employee ID or email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/supervisor/login', async (req, res) => {
  const { employee_id, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM supervisors WHERE employee_id = ? AND is_active = 1', [employee_id]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    if (!await bcrypt.compare(password, rows[0].password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    const s = rows[0];
    res.json({
      token: sign({ id: s.id, role: 'supervisor', zone: s.zone, name: s.name }),
      name: s.name, zone: s.zone, employee_id: s.employee_id, admin_key: s.admin_key
    });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/supervisor/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query('SELECT id FROM supervisors WHERE email = ?', [email]);
    if (!rows.length) return res.status(404).json({ error: 'No supervisor account with that email' });
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const exp = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('UPDATE supervisors SET otp_code=?, otp_expires=? WHERE email=?', [otp, exp, email]);
    console.log(`[OTP] Supervisor ${email}: ${otp}`);
    res.json({ message: 'OTP sent to your email' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/supervisor/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM supervisors WHERE email=? AND otp_code=? AND otp_expires > NOW()', [email, otp]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE supervisors SET password_hash=?, otp_code=NULL, otp_expires=NULL WHERE email=?', [hash, email]);
    res.json({ message: 'Password reset successfully' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// 
//  SUPERVISOR  MY TEAM (own staff only)
// 
router.get('/supervisor/my-staff', auth('supervisor'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.name, s.employee_id, s.zone, s.is_active,
             s.performance_rating, s.active_jobs, s.availability, s.repairs_completed,
             COUNT(a.id) AS total_assignments
      FROM staff s
      LEFT JOIN assignments a ON a.staff_id = s.id
      WHERE s.supervisor_id = ?
      GROUP BY s.id
      ORDER BY s.name
    `, [req.user.id]);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/auth/supervisor/my-staff/:id   one staff member details (supervisor only, no citizen data)
router.get('/supervisor/my-staff/:id', auth('supervisor'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.name, s.employee_id, s.zone, s.is_active,
             s.performance_rating, s.active_jobs, s.availability, s.repairs_completed,
             COUNT(a.id) AS total_assignments
      FROM staff s
      LEFT JOIN assignments a ON a.staff_id = s.id
      WHERE s.id = ? AND s.supervisor_id = ?
      GROUP BY s.id
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Staff not found in your team' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// PUT update staff availability/rating (supervisor only)
router.put('/supervisor/my-staff/:id', auth('supervisor'), async (req, res) => {
  const { availability, performance_rating, is_active } = req.body;
  try {
    const fields = [];
    const vals   = [];
    if (availability        != null) { fields.push('availability = ?');        vals.push(availability); }
    if (performance_rating  != null) { fields.push('performance_rating = ?');  vals.push(performance_rating); }
    if (is_active           != null) { fields.push('is_active = ?');           vals.push(is_active); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id, req.user.id);
    await db.query(`UPDATE staff SET ${fields.join(', ')} WHERE id = ? AND supervisor_id = ?`, vals);
    res.json({ message: 'Updated' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
