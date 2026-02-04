// 🏥 HEALTH ROUTE
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Hata yönetimini garantiye almak için try-catch
let groqInstance = null;
try {
  const GroqProvider = require('../ai/groqProvider');
  groqInstance = new GroqProvider();
} catch (error) {
  console.error('❌ Health Route: GroqProvider yüklenemedi:', error.message);
}

/**
 * GET /health
 * Basit sağlık kontrolü
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'Zeta AI Backend',
    uptime: formatUptime(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: formatUptime(uptime),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      },
      nodeVersion: process.version
    },
    services: {
      groq: checkGroqStatus(),
      storage: await checkStorageHealth()
    }
  };

  res.json(health);
});

// ====================================================================
// YARDIMCI FONKSİYONLAR
// ====================================================================

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function checkGroqStatus() {
  if (!groqInstance) return { status: 'unhealthy', message: 'Provider not initialized' };
  try {
    const info = groqInstance.getModelInfo();
    return {
      status: info.available ? 'healthy' : 'unhealthy',
      model: info.model,
      available: info.available
    };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

async function checkStorageHealth() {
  try {
    // Klasör yolunu ana dizine göre ayarla (Zeta-AI yapısına uygun)
    const storagePath = path.join(__dirname, '../storage/conversations');
    
    // Klasör yoksa oluştur (500 hatasını engellemek için kritik)
    await fs.mkdir(storagePath, { recursive: true });
    
    const files = await fs.readdir(storagePath);
    return {
      status: 'healthy',
      conversationCount: files.filter(f => f.endsWith('.json')).length
    };
  } catch (error) {
    return { status: 'degraded', message: error.message };
  }
}

module.exports = router;