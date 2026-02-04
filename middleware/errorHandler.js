// 🚨 ERROR HANDLER MIDDLEWARE
// Merkezi hata yönetimi

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error Handler:', {
    message: err.message,
    path: req.path,
    method: req.method
  });

  let statusCode = 500;
  let errorResponse = {
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: '❌ Bir hata oluştu. Lütfen tekrar deneyin.'
  };

  if (err.message === 'GROQ_API_KEY_MISSING') {
    statusCode = 500;
    errorResponse = {
      success: false,
      error: 'GROQ_API_KEY_MISSING',
      message: '🔑 **API Anahtarı Eksik!**\n\n.env dosyanıza VITE_GROQ_API_KEY ekleyin.'
    };
  }

  else if (err.message === 'RATE_LIMIT_EXCEEDED') {
    statusCode = 429;
    errorResponse = {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: '⏳ **API Limiti Aşıldı!**\n\nLütfen 1 dakika bekleyin.',
      retryAfter: 60
    };
  }

  else if (err.message === 'INVALID_API_KEY') {
    statusCode = 401;
    errorResponse = {
      success: false,
      error: 'INVALID_API_KEY',
      message: '🔑 **Geçersiz API Anahtarı!**'
    };
  }

  res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `❌ Route bulunamadı: ${req.method} ${req.path}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};