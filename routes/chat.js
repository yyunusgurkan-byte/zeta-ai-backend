// 💬 CHAT ROUTE
// Ana sohbet endpoint'i (Claude'daki /api/messages'a benzer)

const express = require('express');
const router = express.Router();
const ZetaOrchestrator = require('../core/orchestrator');
const { chatLimiter } = require('../middleware/rateLimiter');

// Orchestrator instance
const orchestrator = new ZetaOrchestrator();

/**
 * POST /api/chat
 * Ana chat endpoint'i
 */
router.post('/', chatLimiter, async (req, res, next) => {
  try {
    const { message, conversationId, history } = req.body;

    // Validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: '⚠️ Mesaj gerekli!'
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'EMPTY_MESSAGE',
        message: '⚠️ Mesaj boş olamaz!'
      });
    }

    console.log(`💬 Chat request: "${message.substring(0, 50)}..."`);
    console.log(`   Conversation ID: ${conversationId || 'new'}`);
    console.log(`   History length: ${history?.length || 0}`);

    // Orchestrator'a gönder
    const result = await orchestrator.process(message, history || []);

    // Başarılı yanıt
    if (result.type === 'success') {
      res.json({
        success: true,
        response: result.message,
        conversationId: conversationId || `conv_${Date.now()}`,
        toolUsed: result.toolUsed || null,
        metadata: {
          timestamp: new Date().toISOString(),
          messageLength: result.message.length,
          toolData: result.toolData || null
        }
      });
    }
    
    // Güvenlik engeli
    else if (result.type === 'safety_block') {
      res.status(400).json({
        success: false,
        error: 'SAFETY_BLOCK',
        message: result.message,
        reason: result.reason
      });
    }
    
    // Hata
    else if (result.type === 'error') {
      res.status(500).json({
        success: false,
        error: 'PROCESSING_ERROR',
        message: result.message
      });
    }
    
    // Bilinmeyen tip
    else {
      res.status(500).json({
        success: false,
        error: 'UNKNOWN_RESPONSE_TYPE',
        message: '❌ Beklenmeyen yanıt tipi'
      });
    }

  } catch (error) {
    console.error('❌ Chat route error:', error);
    next(error); // Error handler'a gönder
  }
});

/**
 * GET /api/chat/tools
 * Mevcut toolları listele
 */
router.get('/tools', (req, res) => {
  try {
    const tools = orchestrator.listTools();
    
    res.json({
      success: true,
      tools: tools,
      count: tools.length
    });
  } catch (error) {
    console.error('❌ Tools list error:', error);
    res.status(500).json({
      success: false,
      error: 'TOOLS_LIST_ERROR',
      message: 'Tool listesi alınamadı'
    });
  }
});

/**
 * GET /api/chat/status
 * Chat servisinin durumu
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    service: 'Zeta AI Chat',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
