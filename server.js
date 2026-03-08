// 🚀 ZETA AI - BACKEND SERVER
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadDir = path.join(__dirname, 'storage', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadDir));

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ====================================================================
// ROUTES
// ====================================================================

// Health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend aktif',
    time: new Date().toISOString()
  });
});

app.get('/ping', (req, res) => {
  res.send('OK');
});

// API Routes
const chatRoutes = require('./routes/chat');
const conversationRoutes = require('./routes/conversation');
const uploadRoutes = require('./routes/upload');
const packageRoutes = require('./routes/packageRoute');

const iddaaRoutes = require('./routes/iddaaRoute');
app.use('/api/iddaa', iddaaRoutes);
const dovizRoutes = require('./routes/dovizRoute');
app.use('/api/doviz', dovizRoutes);
const footballRoutes = require('./routes/football');
app.use('/api/football', footballRoutes);

app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', packageRoutes);


// ====================================================================
// ERROR HANDLER - Wildcard'dan ÖNCE!
// ====================================================================
app.use((err, req, res, next) => {
  console.error("❌ HATA:", err.message);
  res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: err.message
  });
});

// ====================================================================
// WILDCARD ROUTE - EN SONDA!
// ====================================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `❌ Route bulunamadı: ${req.method} ${req.path}`
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda başlatıldı.`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`📤 Upload: http://localhost:${PORT}/api/upload`);
  console.log(`📦 Package Analyzer: http://localhost:${PORT}/api/analyze-packages`);
  console.log(`💊 Eczane: http://localhost:${PORT}/api/eczane/:sehir`);
});

module.exports = app;