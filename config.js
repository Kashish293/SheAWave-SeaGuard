// Application configuration
require('dotenv').config();

module.exports = {
    // Server configuration
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // ML Service configuration
    mlService: {
        url: process.env.ML_SERVICE_URL || 'http://localhost:5001',
        timeout: parseInt(process.env.ML_SERVICE_TIMEOUT) || 10000,
        retries: parseInt(process.env.ML_SERVICE_RETRIES) || 3,
    },

    // Ghost net detection thresholds
    ghostNet: {
        confidenceThreshold: parseFloat(process.env.GHOST_NET_THRESHOLD) || 0.75,
        suspectedThreshold: parseFloat(process.env.GHOST_NET_SUSPECTED_THRESHOLD) || 0.50,
    },

    // Alert configuration
    alerts: {
        emailEnabled: process.env.ALERT_EMAIL_ENABLED === 'true',
        smsEnabled: process.env.ALERT_SMS_ENABLED === 'true',
        pushEnabled: process.env.ALERT_PUSH_ENABLED === 'true',
    },

    // Background job configuration
    jobs: {
        batchProcessingInterval: parseInt(process.env.BATCH_PROCESSING_INTERVAL) || 300000, // 5 minutes
        driftPredictionInterval: parseInt(process.env.DRIFT_PREDICTION_INTERVAL) || 3600000, // 1 hour
    },

    // Feature extraction configuration
    features: {
        minDataPointsForML: parseInt(process.env.MIN_DATA_POINTS_FOR_ML) || 5,
        timeWindowHours: parseInt(process.env.FEATURE_TIME_WINDOW_HOURS) || 24,
    },

    // Drift prediction horizons (in hours)
    driftPrediction: {
        horizons: [6, 24, 72],
    },
};
