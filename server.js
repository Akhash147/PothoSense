const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory
const fs = require('fs');
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// Trust proxy (for rate limiting behind nginx)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' }
});

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', limiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'PothoSense API running',
    version: '2.0.0',
    timestamp: new Date(),
    features: ['auth', 'reports', 'analytics', 'gamification', 'predictive', 'route-optimizer', 'sla', 'notifications']
  });
});

// -- Hourly SLA cron job ------------------------------------
cron.schedule('0 * * * *', async () => {
  try {
    await axios.post(`http://localhost:${PORT}/api/analytics/check-sla`);
    console.log('[SLA] Check completed');
  } catch (err) {
    console.error('SLA cron error:', err.message);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[SERVER] PothoSense Backend v2.0 running at http://localhost:${PORT}`);
  console.log(`[SERVER] Health: http://localhost:${PORT}/api/health`);
  console.log(`[SERVER] SLA cron: every hour\n`);
});
