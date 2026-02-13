// 🚀 ZETA AI - BACKEND SERVER (Plesk Optimized v2)
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Plesk/Passenger genelde PORT değişkenini otomatik atar
const PORT = process.env.PORT || 3001;

// ====================================================================
// 🔧 YAPILANDIRMA VE GÜVENLİK
// ====================================================================
app.set('trust proxy', true);

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📁 Klasör Kontrolü - Mutlaka tam yol kullanıyoruz
const uploadDir = path.join(__dirname, 'storage', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ====================================================================
// 📂 STATİK DOSYALAR
// ====================================================================
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadDir));

// Basit İstek Loglayıcı (Plesk Loglarında "Logs" sekmesinde görünür)
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// ====================================================================
// 🚀 ROTALAR (Routes)
// ====================================================================

// Sağlık kontrolü (404 alıyorsan ilk burayı test et: domain.com/health)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Backend aktif',
    time: new Date().toISOString() 
  });
});

// API Durum
app.get('/api/status', (req, res) => {
  res.json({ service: 'Zeta AI Backend', status: 'running' });
});

// MODÜLER ROTALAR
// Not: routes klasörünün server.js ile aynı yerde olduğundan emin ol!
try {
  const chatRoutes = require('./routes/chat');
  const conversationRoutes = require('./routes/conversation');
  const uploadRoutes = require('./routes/upload');

  app.use('/api/chat', chatRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/upload', uploadRoutes);
} catch (err) {
  console.error("❌ Rotalar yüklenirken hata oluştu (Dosya eksik olabilir):", err.message);
}

// 🌐 FRONTEND YÖNLENDİRMESİ (SPA için)
// Statik dosya değilse ve API değilse index.html'i döndür
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("index.html bulunamadı! Lütfen frontend build dosyalarını kontrol edin.");
  }
});

// ====================================================================
// ⚠️ HATA YÖNETİMİ
// ====================================================================
app.use((err, req, res, next) => {
  console.error("🔥 KRİTİK HATA:", err.message);
  res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: err.message
  });
});

// ====================================================================
// 📡 SERVER BAŞLAT
// ====================================================================
// Plesk'te 0.0.0.0 yazmak bazen çakışma yaratır, sadece PORT yeterlidir
app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});

module.exports = app;