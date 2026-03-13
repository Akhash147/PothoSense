const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// ============================================================
//  LEADERBOARD & GAMIFICATION
// ============================================================

const BADGE_META = {
  newcomer:        { label: 'Newcomer',        emoji: '', minPoints: 0 },
  first_reporter:  { label: 'First Reporter',  emoji: '', minPoints: 10 },
  active_citizen:  { label: 'Active Citizen',  emoji: '', minPoints: 50 },
  road_hero:       { label: 'Road Hero',       emoji: '', minPoints: 100 },
  legend:          { label: 'Legend',          emoji: '', minPoints: 200 },
};

// GET /api/analytics/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id,
             CONCAT(LEFT(c.username,2), REPEAT('*', GREATEST(LENGTH(c.username)-2,0))) AS display_name,
             c.points, c.badge,
             COUNT(r.id) AS total_reports,
             SUM(r.status = 'resolved') AS resolved_count
      FROM citizens c
      LEFT JOIN reports r ON c.id = r.citizen_id
      GROUP BY c.id, c.username, c.points, c.badge
      ORDER BY c.points DESC
      LIMIT 20
    `);

    const leaderboard = rows.map((row, i) => ({
      rank: i + 1,
      ...row,
      badge_meta: BADGE_META[row.badge] || BADGE_META.newcomer,
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/my-stats -- citizen's own stats
router.get('/my-stats', auth('citizen'), async (req, res) => {
  try {
    const [[citizen]] = await db.query(
      'SELECT username, points, badge FROM citizens WHERE id = ?', [req.user.id]
    );
    const [[stats]] = await db.query(`
      SELECT COUNT(*) AS total,
             SUM(status='pending') AS pending,
             SUM(status='resolved') AS resolved,
             SUM(status='in_progress') AS in_progress
      FROM reports WHERE citizen_id = ?
    `, [req.user.id]);

    const [[rank]] = await db.query(
      'SELECT COUNT(*)+1 AS rank FROM citizens WHERE points > (SELECT points FROM citizens WHERE id = ?)',
      [req.user.id]
    );

    // Next badge threshold
    const currentBadge = BADGE_META[citizen.badge] || BADGE_META.newcomer;
    const badgeKeys = Object.keys(BADGE_META);
    const currentIdx = badgeKeys.indexOf(citizen.badge);
    const nextBadgeKey = badgeKeys[currentIdx + 1];
    const nextBadge = nextBadgeKey ? BADGE_META[nextBadgeKey] : null;

    res.json({
      username: citizen.username,
      points: citizen.points,
      badge: citizen.badge,
      badge_meta: currentBadge,
      next_badge: nextBadge,
      rank: rank.rank,
      stats,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  ANALYTICS (Enhanced)
// ============================================================

// GET /api/analytics/summary -- full dashboard analytics
router.get('/summary', auth('staff'), async (req, res) => {
  try {
    // Overall totals
    const [[totals]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status='pending') AS pending,
        SUM(status='in_progress') AS in_progress,
        SUM(status='resolved') AS resolved,
        SUM(status='rejected') AS rejected,
        SUM(severity='severe') AS severe,
        SUM(severity='moderate') AS moderate,
        SUM(severity='minor') AS minor,
        SUM(sla_breached=1) AS sla_breaches,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(resolved_at, NOW()))), 1) AS avg_hours_to_resolve,
        ROUND(SUM(status='resolved')/COUNT(*)*100, 1) AS resolution_rate
      FROM reports
    `);

    // 7-day trend
    const [trend] = await db.query(`
      SELECT DATE(created_at) AS day,
             COUNT(*) AS reported,
             SUM(status='resolved') AS resolved
      FROM reports
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY day ORDER BY day ASC
    `);

    // By zone
    const [byZone] = await db.query(`
      SELECT s.zone,
             COUNT(r.id) AS total,
             SUM(r.status='resolved') AS resolved,
             SUM(r.severity='severe') AS severe
      FROM reports r
      JOIN staff s ON r.assigned_staff_id = s.id
      WHERE s.zone IS NOT NULL
      GROUP BY s.zone ORDER BY total DESC
    `);

    // Staff performance
    const [staffPerf] = await db.query(`
      SELECT s.name, s.zone, s.employee_id,
             COUNT(r.id) AS assigned,
             SUM(r.status='resolved') AS completed,
             ROUND(AVG(TIMESTAMPDIFF(HOUR, r.created_at, r.resolved_at)),1) AS avg_hours
      FROM staff s
      LEFT JOIN reports r ON s.id = r.assigned_staff_id
      WHERE s.is_active = 1
      GROUP BY s.id, s.name, s.zone, s.employee_id
      ORDER BY completed DESC
    `);

    // Monthly trend (last 6 months)
    const [monthly] = await db.query(`
      SELECT DATE_FORMAT(created_at,'%Y-%m') AS month_key,
             DATE_FORMAT(MIN(created_at),'%b %Y') AS month,
             COUNT(*) AS reported,
             SUM(status='resolved') AS resolved
      FROM reports
      GROUP BY DATE_FORMAT(created_at,'%Y-%m')
      ORDER BY month_key DESC LIMIT 6
    `);

    // SLA breaches
    const [slaBreaches] = await db.query(`
      SELECT id, tracking_token, address, severity,
             created_at, sla_deadline,
             TIMESTAMPDIFF(HOUR, sla_deadline, NOW()) AS hours_overdue,
             assigned_staff_id
      FROM reports
      WHERE sla_breached = 1 AND status != 'resolved'
      ORDER BY hours_overdue DESC LIMIT 10
    `);

    res.json({
      totals,
      trend,
      zone_breakdown: byZone,
      staff_performance: staffPerf,
      monthly: monthly.reverse(),
      sla_breaches: slaBreaches
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  PREDICTIVE MAINTENANCE (AI)
// ============================================================

// GET /api/analytics/predictive
router.get('/predictive', auth('staff'), async (req, res) => {
  try {
    // Grid-based clustering: 0.005 deg  500m cells
    const [rows] = await db.query(`
      SELECT
        ROUND(latitude, 2) AS grid_lat,
        ROUND(longitude, 2) AS grid_lng,
        COUNT(*) AS pothole_count,
        AVG(CASE severity WHEN 'severe' THEN 10 WHEN 'moderate' THEN 5 ELSE 2 END) AS avg_severity,
        SUM(CASE WHEN status != 'resolved' THEN 1 ELSE 0 END) AS active_count,
        GROUP_CONCAT(DISTINCT address SEPARATOR ', ') AS areas
      FROM reports
      GROUP BY grid_lat, grid_lng
      HAVING pothole_count >= 2
      ORDER BY (pothole_count * avg_severity) DESC
      LIMIT 10
    `);

    const predictions = rows.map((r, i) => ({
      rank: i + 1,
      lat: parseFloat(r.grid_lat),
      lng: parseFloat(r.grid_lng),
      pothole_count: r.pothole_count,
      active_count: r.active_count,
      avg_severity: parseFloat(r.avg_severity).toFixed(1),
      risk_score: parseFloat(((r.pothole_count * r.avg_severity) / 10).toFixed(1)),
      risk_level: r.pothole_count * r.avg_severity > 30 ? 'critical' : r.pothole_count * r.avg_severity > 15 ? 'high' : 'medium',
      areas: r.areas ? r.areas.split(', ').slice(0, 3).join(', ') : 'Unknown area',
      recommendation: r.pothole_count * r.avg_severity > 30
        ? 'Immediate road resurfacing required'
        : r.pothole_count * r.avg_severity > 15
        ? 'Schedule inspection within 48 hours'
        : 'Monitor and plan routine maintenance',
    }));

    const hotspots = rows.map((r, i) => ({
      rank: i + 1,
      lat: parseFloat(r.grid_lat),
      lng: parseFloat(r.grid_lng),
      report_count: r.pothole_count,
      severe_count: 0,
      unresolved_count: r.active_count,
      avg_severity: parseFloat(r.avg_severity).toFixed(1),
      risk_score: parseFloat(((r.pothole_count * r.avg_severity) / 10).toFixed(1)),
      risk_level: r.pothole_count * r.avg_severity > 30 ? 'critical' : r.pothole_count * r.avg_severity > 15 ? 'high' : 'medium',
      areas: r.areas ? r.areas.split(', ').slice(0, 3).join(', ') : 'Unknown area',
      recommendation: r.pothole_count * r.avg_severity > 30
        ? 'Immediate road resurfacing required'
        : r.pothole_count * r.avg_severity > 15
        ? 'Schedule inspection within 48 hours'
        : 'Monitor and plan routine maintenance',
    }));
    res.json({ hotspots, generated_at: new Date() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  ROUTE OPTIMIZER (Staff)
// ============================================================

// POST /api/analytics/optimize-route
router.post('/optimize-route', auth('staff'), async (req, res) => {
  const { lat, lng, max_distance = 10, limit = 15 } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'Staff location required' });

  try {
    // Get pending/in_progress potholes within max_distance (degrees  111km/degree)
    const degDelta = max_distance / 111;
    const [potholes] = await db.query(`
      SELECT id, tracking_token, latitude, longitude, address, severity, status
      FROM reports
      WHERE status IN ('pending','assigned')
      AND latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      ORDER BY FIELD(severity,'severe','moderate','minor')
      LIMIT ?
    `, [
      lat - degDelta, lat + degDelta,
      lng - degDelta, lng + degDelta,
      parseInt(limit)
    ]);

    if (!potholes.length) {
      return res.json({ route: [], total_distance: 0, estimated_minutes: 0, message: 'No potholes found in range' });
    }

    // Greedy nearest-neighbor from staff position
    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    let remaining = [...potholes];
    let route = [];
    let curLat = parseFloat(lat), curLng = parseFloat(lng);
    let totalDist = 0;

    while (remaining.length) {
      let nearestIdx = 0, minDist = Infinity;
      remaining.forEach((p, i) => {
        const d = haversine(curLat, curLng, parseFloat(p.latitude), parseFloat(p.longitude));
        if (d < minDist) { minDist = d; nearestIdx = i; }
      });
      const stop = remaining.splice(nearestIdx, 1)[0];
      totalDist += minDist;
      route.push({
        ...stop,
        distance_from_prev: parseFloat(minDist.toFixed(2)),
        cumulative_km: parseFloat(totalDist.toFixed(2)),
      });
      curLat = parseFloat(stop.latitude);
      curLng = parseFloat(stop.longitude);
    }

    res.json({
      route: route.map(s => ({ ...s, dist_km: s.distance_from_prev })),
      total_stops: route.length,
      total_distance_km: parseFloat(totalDist.toFixed(2)),
      estimated_time_hrs: parseFloat((totalDist / 30).toFixed(1)), // ~30 km/h city speed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  ROUTE SAFETY CHECKER (Citizen)
// ============================================================

// POST /api/analytics/route-safety
router.post('/route-safety', async (req, res) => {
  const { waypoints } = req.body; // [{lat, lng}] array
  if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2)
    return res.status(400).json({ error: 'Provide at least 2 waypoints' });

  try {
    // Build bounding box around all waypoints
    const lats = waypoints.map(w => parseFloat(w.lat));
    const lngs = waypoints.map(w => parseFloat(w.lng));
    const minLat = Math.min(...lats) - 0.01;
    const maxLat = Math.max(...lats) + 0.01;
    const minLng = Math.min(...lngs) - 0.01;
    const maxLng = Math.max(...lngs) + 0.01;

    const [potholes] = await db.query(`
      SELECT latitude, longitude, severity, address
      FROM reports
      WHERE status != 'resolved'
      AND latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
    `, [minLat, maxLat, minLng, maxLng]);

    const severityScore = { severe: 10, moderate: 5, minor: 2 };
    const totalScore = potholes.reduce((sum, p) => sum + (severityScore[p.severity] || 0), 0);
    const safetyScore = Math.max(0, 100 - totalScore * 2);

    const riskLevel = safetyScore >= 80 ? 'safe' : safetyScore >= 50 ? 'moderate' : 'dangerous';

    res.json({
      safety_score: safetyScore,
      risk_level: riskLevel,
      pothole_count: potholes.length,
      severe_count: potholes.filter(p => p.severity === 'severe').length,
      moderate_count: potholes.filter(p => p.severity === 'moderate').length,
      minor_count: potholes.filter(p => p.severity === 'minor').length,
      potholes,
      recommendation: riskLevel === 'safe'
        ? 'Route looks clear. Safe to proceed.'
        : riskLevel === 'moderate'
        ? 'Some potholes detected. Drive carefully.'
        : 'High pothole density. Consider alternative route.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  ACTIVITY TIMELINE
// ============================================================

// GET /api/analytics/timeline
router.get('/timeline', auth('staff'), async (req, res) => {
  try {
    const [activity] = await db.query(`
      SELECT 
        wl.id, wl.action, wl.notes, wl.logged_at,
        s.name AS staff_name,
        r.tracking_token, r.address, r.severity
      FROM work_log wl
      JOIN staff s ON wl.staff_id = s.id
      JOIN reports r ON wl.report_id = r.id
      ORDER BY wl.logged_at DESC
      LIMIT 50
    `);
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  AUTO-ASSIGN
// ============================================================

// POST /api/analytics/auto-assign
router.post('/auto-assign', auth('staff'), async (req, res) => {
  try {
    // Get unassigned pending reports
    const [unassigned] = await db.query(
      `SELECT id, latitude, longitude, severity FROM reports WHERE status='pending' AND assigned_staff_id IS NULL`
    );
    if (!unassigned.length) return res.json({ message: 'No unassigned reports', assigned: 0 });

    // Get active staff with their zones
    const [staffList] = await db.query(
      `SELECT id, name, zone FROM staff WHERE is_active=1`
    );
    if (!staffList.length) return res.json({ message: 'No active staff', assigned: 0 });

    let assigned = 0;
    for (const report of unassigned) {
      // Round-robin assignment
      const staffMember = staffList[assigned % staffList.length];
      await db.query(
        `UPDATE reports SET assigned_staff_id=?, status='assigned' WHERE id=?`,
        [staffMember.id, report.id]
      );
      await db.query(
        `INSERT INTO work_log (staff_id, report_id, action, notes) VALUES (?,?,'assigned','Auto-assigned by system')`,
        [staffMember.id, report.id]
      );
      // Notify staff
      await db.query(
        `INSERT INTO notifications (user_id, user_type, title, message, type, report_id) VALUES (?,?,'New Assignment ',?,'info',?)`,
        [staffMember.id, 'staff',
         `You have been assigned a ${report.severity} pothole at ${report.id}`,
         report.id]
      );
      assigned++;
    }

    res.json({ message: `${assigned} reports auto-assigned`, assigned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  NOTIFICATIONS
// ============================================================

// GET /api/analytics/notifications
router.get('/notifications', auth(), async (req, res) => {
  try {
    const [notifs] = await db.query(
      `SELECT * FROM notifications WHERE user_id=? AND user_type=? ORDER BY created_at DESC LIMIT 20`,
      [req.user.id, req.user.role]
    );
    const [[{ unread }]] = await db.query(
      `SELECT COUNT(*) AS unread FROM notifications WHERE user_id=? AND user_type=? AND is_read=0`,
      [req.user.id, req.user.role]
    );
    res.json({ notifications: notifs, unread });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/analytics/notifications/read-all
router.put('/notifications/read-all', auth(), async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read=1 WHERE user_id=? AND user_type=?`,
      [req.user.id, req.user.role]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  REPAIR VERIFICATION
// ============================================================

// GET /api/analytics/pending-verifications -- for citizen
router.get('/pending-verifications', auth('citizen'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.tracking_token, r.address, r.latitude, r.longitude,
             r.severity, r.resolved_at, r.after_photo
      FROM reports r
      WHERE r.status = 'resolved'
      AND r.citizen_id = ?
      AND r.id NOT IN (SELECT report_id FROM verifications WHERE citizen_id = ?)
      ORDER BY r.resolved_at DESC
    `, [req.user.id, req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/analytics/verify/:reportId
router.post('/verify/:reportId', auth('citizen'), async (req, res) => {
  const { is_satisfied, comment } = req.body;
  try {
    // Check not already verified
    const [[exists]] = await db.query(
      'SELECT id FROM verifications WHERE report_id=? AND citizen_id=?',
      [req.params.reportId, req.user.id]
    );
    if (exists) return res.status(409).json({ error: 'Already verified' });

    await db.query(
      'INSERT INTO verifications (report_id, citizen_id, is_satisfied, comment) VALUES (?,?,?,?)',
      [req.params.reportId, req.user.id, is_satisfied ? 1 : 0, comment || null]
    );

    // If <50% satisfied (>=3 votes), revert to pending
    const [[voteStats]] = await db.query(
      'SELECT COUNT(*) AS total, SUM(is_satisfied=1) AS satisfied FROM verifications WHERE report_id=?',
      [req.params.reportId]
    );
    if (voteStats.total >= 3 && (voteStats.satisfied / voteStats.total) < 0.5) {
      await db.query(
        `UPDATE reports SET status='pending', resolved_at=NULL WHERE id=?`,
        [req.params.reportId]
      );
      return res.json({ message: 'Verification recorded. Repair quality flagged -- reopened for review.' });
    }

    // Award verification points
    await db.query('UPDATE citizens SET points=points+2 WHERE id=?', [req.user.id]);

    res.json({ message: 'Verification submitted. +2 points!', votes: voteStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  SLA CHECK (run manually or via cron)
// ============================================================

// POST /api/analytics/check-sla (can be called by a cron job)
router.post('/check-sla', async (req, res) => {
  try {
    const [breached] = await db.query(`
      SELECT r.id, r.tracking_token, r.severity, r.assigned_staff_id, r.address
      FROM reports r
      WHERE r.status NOT IN ('resolved','rejected')
      AND r.sla_deadline IS NOT NULL
      AND r.sla_deadline < NOW()
      AND r.sla_breached = 0
    `);

    for (const r of breached) {
      await db.query('UPDATE reports SET sla_breached=1 WHERE id=?', [r.id]);
      if (r.assigned_staff_id) {
        await db.query(
          `INSERT INTO notifications (user_id, user_type, title, message, type, report_id)
           VALUES (?,?,'(!) SLA Breach',?,'alert',?)`,
          [r.assigned_staff_id, 'staff',
           `SLA breached for ${r.severity} pothole: ${r.address || r.tracking_token}`,
           r.id]
        );
      }
    }

    res.json({ breaches_found: breached.length, message: `${breached.length} SLA breaches processed` });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  WEATHER (proxied via backend to keep API key secret)
// ============================================================

// GET /api/analytics/weather/:lat/:lng
router.get('/weather/:lat/:lng', auth('staff'), async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      // Return mock data if no API key configured
      return res.json({
        weather: 'Clear',
        description: 'clear sky',
        temp: 28,
        humidity: 65,
        wind_speed: 12,
        icon: '01d',
        suitable_for_repair: true,
        advisory: 'Good conditions for road repair work.',
      });
    }

    const axios = require('axios');
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`,
      { timeout: 5000 }
    );
    const w = response.data;
    const weather_id = w.weather[0].id;
    const suitable = weather_id >= 800; // Clear or clouds OK, rain/storm NOT OK

    res.json({
      weather: w.weather[0].main,
      description: w.weather[0].description,
      temp: Math.round(w.main.temp),
      humidity: w.main.humidity,
      wind_speed: Math.round(w.wind.speed * 3.6), // m/s to km/h
      icon: w.weather[0].icon,
      suitable_for_repair: suitable,
      advisory: suitable
        ? 'Good conditions for road repair work.'
        : 'Rain or storm detected. Postpone repair work.',
    });
  } catch (err) {
    res.json({ weather: 'Unknown', suitable_for_repair: true, advisory: 'Weather data unavailable.' });
  }
});

// ============================================================
//  MAP DATA (for citizen and staff maps)
// ============================================================

// GET /api/analytics/map-potholes
router.get('/map-potholes', async (req, res) => {
  const { minLat, maxLat, minLng, maxLng } = req.query;
  try {
    let query = `
      SELECT id, tracking_token, latitude, longitude, address,
             severity, status, created_at, photo_path
      FROM reports WHERE status != 'rejected'
    `;
    const params = [];
    if (minLat && maxLat && minLng && maxLng) {
      query += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
      params.push(minLat, maxLat, minLng, maxLng);
    }
    query += ' ORDER BY FIELD(severity,"severe","moderate","minor") LIMIT 500';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/batch-detect -- mobile batch sensor upload
router.post('/batch-detect', auth('citizen'), async (req, res) => {
  const { detections } = req.body; // [{lat, lng, magnitude, speed}]
  if (!detections || !Array.isArray(detections))
    return res.status(400).json({ error: 'detections array required' });

  const { v4: uuidv4 } = require('uuid');
  let created = 0, merged = 0;

  for (const d of detections.slice(0, 20)) {
    const { lat, lng, magnitude, speed } = d;
    if (!lat || !lng) continue;

    const severity = magnitude > 30 ? 'severe' : magnitude > 18 ? 'moderate' : 'minor';
    const degDelta = 0.00015; // ~15 meters

    // Check for nearby existing
    const [nearby] = await db.query(
      `SELECT id FROM reports WHERE status!='resolved'
       AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
       LIMIT 1`,
      [lat - degDelta, lat + degDelta, lng - degDelta, lng + degDelta]
    );

    if (nearby.length) {
      await db.query('UPDATE reports SET upvotes=upvotes+1 WHERE id=?', [nearby[0].id]);
      merged++;
    } else {
      const token = uuidv4().replace(/-/g,'').substring(0,16).toUpperCase();
      await db.query(
        `INSERT INTO reports (tracking_token, citizen_id, latitude, longitude, severity, sensor_magnitude, detection_type)
         VALUES (?,?,?,?,?,?,'sensor')`,
        [token, req.user.id, lat, lng, severity, magnitude || null]
      );
      // +5 points for sensor detection
      await db.query('UPDATE citizens SET points=points+5 WHERE id=?', [req.user.id]);
      created++;
    }
  }

  res.json({ message: `Processed ${detections.length} detections`, created, merged });
});

module.exports = router;
