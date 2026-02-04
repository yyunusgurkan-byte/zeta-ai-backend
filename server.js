// 🚀 ZETA AI - BACKEND SERVER
const express = require('express');
const cors = require('cors');
const path = require('path'); // Dosya yolları için eklendi
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
// MIDDLEWARE
// ====================================================================
app.use(cors({
  origin: ['http://www.alzeta.site', 'http://alzeta.site', 'https://www.alzeta.site', 'https://alzeta.site'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Bu satırı ekle!
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📂 STATIK DOSYA SUNUMU (Frontend için eklendi)
// api klasörü içinde olduğun için bir üst dizine (httpdocs) bakıyoruz
app.use(express.static(path.join(__dirname, '../')));

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ====================================================================
// ROUTES
// ====================================================================
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/health', healthRoutes);

// Root endpoint (Backend durum kontrolü için alt yolda tutuldu)
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Zeta AI Backend',
    version: '1.0.0',
    status: 'running'
  });
});

// 🌐 FRONTEND YONLENDIRMESI (Kritik: Ana sayfa artık siteyi açar)
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
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://www.alzeta.site'}`);
  console.log(`⏰ Started: ${new Date().toLocaleString('tr-TR')}`);
  console.log('🚀 ================================');
  console.log('');
});

module.exports = app;