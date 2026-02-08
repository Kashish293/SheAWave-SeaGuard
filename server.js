// 🌊 SeaGuard Backend - Intelligent Ghost Fishing Net Detection System
// Main server file with modular architecture

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const logger = require('./utils/logger');
const db = require('./config/database');
const config = require('./config/config');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const netsRoutes = require('./routes/nets');
const gpsRoutes = require('./routes/gps');
const dashboardRoutes = require('./routes/dashboard');
const recoveryRoutes = require('./routes/recovery');

// Initialize Express app
const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ===============================
// FIREBASE INITIALIZATION
// ===============================
const serviceAccount = require('./firebaseKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

db.initialize(admin);
logger.info('✅ Firebase Admin initialized');

// ===============================
// ROUTES
// ===============================

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌊 SeaGuard Backend API is running',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// API health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.nets.limit(1).get();

    // Check ML service (optional - don't fail if ML service is down)
    const mlService = require('./services/mlService');
    const mlHealth = await mlService.healthCheck();

    res.json({
      success: true,
      status: 'healthy',
      services: {
        database: 'healthy',
        mlService: mlHealth.status,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// API routes
app.use('/api/nets', netsRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recovery', recoveryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// ===============================
// START SERVER
// ===============================
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`✅ SeaGuard Backend running on http://localhost:${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`ML Service URL: ${config.mlService.url}`);
  logger.info(`Ghost Net Threshold: ${config.ghostNet.confidenceThreshold}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;