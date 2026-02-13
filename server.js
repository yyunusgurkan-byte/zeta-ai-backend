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

// ✅ Template literal düzeltildi
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// ====================================================================
// ROUTES - TRY-CATCH KALDIRILDI
// ====================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend aktif',
    time: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  res.json({ service: 'Zeta AI Backend', status: 'running' });
});

// ✅ Try-catch kaldırıldı - hata varsa server başlamayacak
const chatRoutes = require('./routes/chat');
const conversationRoutes = require('./routes/conversation');
const uploadRoutes = require('./routes/upload');

app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/upload', uploadRoutes);

// ⚠️ KRİTİK: Wildcard route EN SONA konmalı
// API route'larından SONRA gelmelidir
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Route bulunamadı");
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ HATA:", err.message);
  res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda başlatıldı.`);
});

module.exports = app;