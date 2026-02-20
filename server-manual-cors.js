// 🚀 ZETA AI - BACKEND SERVER
const express = require('express');
const path = require('path');
const { chatLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const chatRoutes = require('./routes/chat');
const conversationRoutes = require('./routes/conversation');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

// Load environment variables
require('dotenv').config();

// ====================================================================
// MANUEL CORS AYARLARI (cors paketi olmadan)
// ====================================================================
app.use((req, res, next) => {
  // İzin verilen origin'ler
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://www.alzeta.site',
    'http://alzeta.site',
    'https://www.alzeta.site',
    'https://alzeta.site'
  ];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Origin header yoksa (Postman gibi) localhost'a izin ver
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Preflight request'leri için
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// ====================================================================
// MIDDLEWARE
// ====================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📂 STATIK DOSYA SUNUMU
app.use(express.static(path.join(__dirname, '../')));

// Request logging
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// ====================================================================
// ROUTES
// ====================================================================
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Zeta AI Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// 🌐 FRONTEND YONLENDIRMESI
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ====================================================================
// ERROR HANDLING
// ====================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ====================================================================
// SERVER START
// ====================================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ================================');
  console.log('🤖 ZETA AI BACKEND');
  console.log('🚀 ================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔐 CORS: ENABLED (localhost:5173)`);
  console.log(`⏰ Started: ${new Date().toLocaleString('tr-TR')}`);
  console.log('🚀 ================================');
  console.log('');
});

module.exports = app;
