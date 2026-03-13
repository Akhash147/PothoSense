// E:\Pothosense\backend\routes\assignments.js  Supervisor assignment engine
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// SLA hours by severity
const SLA = { severe: 24, moderate: 72, minor: 168 };

//  Helper: best available staff for supervisor 
async function pickBestStaff(supervisorId) {
  const [rows] = await db.query(`
    SELECT id, name, availability, active_jobs, performance_rating
    FROM staff
    WHERE supervisor_id = ? AND is_active = 1 AND availability != 'off_duty'
    ORDER BY active_jobs ASC, performance_rating DESC
    LIMIT 1
  `, [supervisorId]);
  return rows[0] || null;
}

//  GET /api/assignments/pending  unassigned reports in supervisor's zone
router.get('/pending', auth('supervisor'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.latitude, r.longitude, r.severity, r.status,
             r.description, r.address, r.created_at, r.tracking_token,
             r.source
      FROM reports r
      WHERE r.status IN ('pending')
        AND r.id NOT IN (SELECT DISTINCT report_id FROM assignments WHERE report_id IS NOT NULL)
      ORDER BY
        CASE r.severity WHEN 'severe'THEN 0 WHEN 'moderate'THEN 1 ELSE 2 END,
        r.created_at ASC
      LIMIT 100
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

//  GET /api/assignments/my  all assignments by this supervisor
router.get('/my', auth('supervisor'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.id, a.assigned_at, a.due_by, a.notes, a.auto_assigned,
             r.id AS report_id, r.severity, r.status, r.address, r.latitude, r.longitude, r.tracking_token,
             s.name AS staff_name, s.employee_id AS staff_emp_id, s.availability
      FROM assignments a
      JOIN reports r ON r.id = a.report_id
      JOIN staff   s ON s.id = a.staff_id
      WHERE a.supervisor_id = ?
      ORDER BY a.assigned_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

//  POST /api/assignments/assign  manual assign
router.post('/assign', auth('supervisor'), async (req, res) => {
  const { report_id, staff_id, notes } = req.body;
  if (!report_id || !staff_id) return res.status(400).json({ error: 'report_id and staff_id required' });
  try {
    // Verify staff belongs to this supervisor
    const [staffRows] = await db.query('SELECT id FROM staff WHERE id=? AND supervisor_id=? AND is_active=1', [staff_id, req.user.id]);
    if (!staffRows.length) return res.status(403).json({ error: 'Staff not in your team' });

    // Get report severity for SLA
    const [rpt] = await db.query('SELECT severity FROM reports WHERE id=?', [report_id]);
    if (!rpt.length) return res.status(404).json({ error: 'Report not found' });
    const hours  = SLA[rpt[0].severity] || 72;
    const dueBy  = new Date(Date.now() + hours * 3600 * 1000);

    await db.query(
      'INSERT INTO assignments (report_id, staff_id, supervisor_id, due_by, notes, auto_assigned) VALUES (?,?,?,?,?,0)',
      [report_id, staff_id, req.user.id, dueBy, notes || null]
    );
    await db.query("UPDATE reports SET status='assigned'WHERE id=?", [report_id]);
    await db.query('UPDATE staff SET active_jobs = active_jobs + 1 WHERE id=?', [staff_id]);

    res.json({ message: 'Assigned successfully', due_by: dueBy });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Report already assigned' });
    res.status(500).json({ error: e.message });
  }
});

//  POST /api/assignments/auto-assign  assign ALL pending to best available staff
router.post('/auto-assign', auth('supervisor'), async (req, res) => {
  try {
    const [pending] = await db.query(`
      SELECT r.id, r.severity FROM reports r
      WHERE r.status = 'pending'
        AND r.id NOT IN (SELECT DISTINCT report_id FROM assignments)
    `);
    if (!pending.length) return res.json({ message: 'No pending reports to assign', assigned: 0 });

    let assigned = 0;
    const errors = [];
    for (const rpt of pending) {
      const staff = await pickBestStaff(req.user.id);
      if (!staff) { errors.push(`No available staff for report ${rpt.id}`); break; }
      const hours = SLA[rpt.severity] || 72;
      const dueBy = new Date(Date.now() + hours * 3600 * 1000);
      try {
        await db.query(
          'INSERT INTO assignments (report_id, staff_id, supervisor_id, due_by, auto_assigned) VALUES (?,?,?,?,1)',
          [rpt.id, staff.id, req.user.id, dueBy]
        );
        await db.query("UPDATE reports SET status='assigned'WHERE id=?", [rpt.id]);
        await db.query('UPDATE staff SET active_jobs = active_jobs + 1 WHERE id=?', [staff.id]);
        assigned++;
      } catch (ex) {
        if (ex.code !== 'ER_DUP_ENTRY') errors.push(ex.message);
      }
    }
    res.json({ message: `Auto-assigned ${assigned} reports`, assigned, errors });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

//  PUT /api/assignments/:id/reassign  move to different staff
router.put('/:id/reassign', auth('supervisor'), async (req, res) => {
  const { staff_id, notes } = req.body;
  try {
    const [asgn] = await db.query('SELECT * FROM assignments WHERE id=? AND supervisor_id=?', [req.params.id, req.user.id]);
    if (!asgn.length) return res.status(404).json({ error: 'Assignment not found' });
    const old = asgn[0];
    // Reduce old staff job count
    await db.query('UPDATE staff SET active_jobs = GREATEST(active_jobs - 1, 0) WHERE id=?', [old.staff_id]);
    // Update assignment
    await db.query('UPDATE assignments SET staff_id=?, notes=? WHERE id=?', [staff_id, notes || old.notes, req.params.id]);
    await db.query('UPDATE staff SET active_jobs = active_jobs + 1 WHERE id=?', [staff_id]);
    res.json({ message: 'Reassigned' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

//  Staff: get my assigned reports 
router.get('/staff/mine', auth('staff'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.id AS assignment_id, a.due_by, a.notes,
             r.id AS report_id, r.severity, r.status, r.address,
             r.latitude, r.longitude, r.description, r.tracking_token, r.created_at
      FROM assignments a
      JOIN reports r ON r.id = a.report_id
      WHERE a.staff_id = ? AND r.status NOT IN ('resolved','rejected')
      ORDER BY a.due_by ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
