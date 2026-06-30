const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const coursesRoutes = require('./routes/courses');
const audioRoutes = require('./routes/audio');
const progressRoutes = require('./routes/progress');
const journalRoutes = require('./routes/journal');
const adminRoutes = require('./routes/admin');
const communityRoutes = require('./routes/community');
const coachingRoutes = require('./routes/coaching');
const notificationsRoutes = require('./routes/notifications');
const professionalCoachingRoutes = require('./routes/professional-coaching');
const professionalCoachesRoutes = require('./routes/professional-coaches');
const coachRoutes = require('./routes/coach');
const subscriptionRoutes = require('./routes/subscription');
const feedbackRoutes = require('./routes/feedback');
const videoCallsRoutes = require('./routes/video-calls');

const WebRTCSignalingServer = require('./services/webrtcSignaling');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebRTC Signaling Server
const webrtcServer = new WebRTCSignalingServer(httpServer);
console.log('✅ WebRTC Signaling Server initialized');

// Export webrtcServer for use in routes
app.set('webrtcServer', webrtcServer);

// Middleware
// Configure helmet with relaxed CSP for development
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(morgan('combined'));

// CORS configuration - Allow all origins for development and mobile apps
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    console.log('🔍 CORS Check:', { origin, allowedOrigins });

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }

    // If ALLOWED_ORIGINS is *, allow all origins
    if (allowedOrigins.includes('*')) {
      console.log('✅ CORS: Allowing all origins (wildcard)');
      return callback(null, true);
    }

    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed');
      return callback(null, true);
    } else {
      console.log('⚠️  CORS: Origin not in list, but allowing anyway');
      // Allow all origins in development/for now
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logging middleware
app.use((req, res, next) => {
  console.log('📥 Incoming Request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    contentType: req.headers['content-type'],
    authorization: req.headers.authorization ? 'Present' : 'None'
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Coffee API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/coaching', coachingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/professional-coaching', professionalCoachingRoutes);
app.use('/api/professional-coaches', professionalCoachesRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/video-calls', videoCallsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Coffee API v2.0',
    tagline: 'Take Control of Your Mind',
    endpoints: {
      auth: '/api/auth',
      mood: '/api/mood',
      courses: '/api/courses',
      audio: '/api/audio',
      progress: '/api/progress',
      journal: '/api/journal'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║         Digital Coffee API v2.0               ║
║      Take Control of Your Mind                ║
║                                               ║
╚═══════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📡 API endpoints available at http://localhost:${PORT}/api
🎥 WebRTC Video Calling enabled with Socket.io
💚 Health check: http://localhost:${PORT}/health
  `);
});

module.exports = app;
