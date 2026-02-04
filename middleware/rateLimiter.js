// ⏱️ RATE LIMITER MIDDLEWARE
// GROQ API limitine uygun (30 istek/dakika)

const rateLimit = require('express-rate-limit');

// Ana chat endpoint için rate limiter
const chatLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 dakika
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30, // 30 istek
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: '⏳ Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    return req.ip || 
           req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress ||
           'unknown';
  },

  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded: ${req.ip}`);
    
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: '⏳ **Çok Fazla İstek!**\n\nGroq API limiti aşıldı. Lütfen 1 dakika bekleyin.',
      retryAfter: 60,
      tip: 'Rate limit: 30 istek/dakika'
    });
  },

  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Daha gevşek limiter (conversation endpoint için)
const conversationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Çok fazla konuşma isteği. Lütfen bekleyin.'
  }
});

// Sıkı limiter (güvenlik için)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Güvenlik nedeniyle geçici olarak engellendiniz.'
  }
});

module.exports = {
  chatLimiter,
  conversationLimiter,
  strictLimiter
};