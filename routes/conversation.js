// 💾 CONVERSATION ROUTE
// Konuşma kaydetme ve yükleme (Claude'daki conversation management'a benzer)

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { conversationLimiter } = require('../middleware/rateLimiter');

// Storage path
const STORAGE_PATH = path.join(__dirname, '../storage/conversations');
// Storage klasörünü oluştur (yoksa)
const ensureStorageExists = async () => {
  try {
    await fs.access(STORAGE_PATH);
  } catch {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
    console.log('📁 Conversation storage created:', STORAGE_PATH);
  }
};

ensureStorageExists();

/**
 * GET /api/conversations
 * Tüm konuşmaları listele
 */
router.get('/', conversationLimiter, async (req, res, next) => {
  try {
    await ensureStorageExists();

    const files = await fs.readdir(STORAGE_PATH);
    const conversations = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(STORAGE_PATH, file);
          const data = await fs.readFile(filePath, 'utf8');
          const conversation = JSON.parse(data);
          
          // Sadece metadata gönder (mesajları değil)
          conversations.push({
            id: conversation.id,
            title: conversation.title || 'Yeni Sohbet',
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messageCount: conversation.messages?.length || 0
          });
        } catch (err) {
          console.warn(`⚠️ Conversation parse error: ${file}`, err.message);
        }
      }
    }

    // Tarihe göre sırala (en yeni önce)
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);

    res.json({
      success: true,
      conversations: conversations,
      count: conversations.length
    });

  } catch (error) {
    console.error('❌ Conversations list error:', error);
    next(error);
  }
});

/**
 * GET /api/conversations/:id
 * Belirli bir konuşmayı getir
 */
router.get('/:id', conversationLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const filePath = path.join(STORAGE_PATH, `${id}.json`);

    const data = await fs.readFile(filePath, 'utf8');
    const conversation = JSON.parse(data);

    res.json({
      success: true,
      conversation: conversation
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
        message: 'Konuşma bulunamadı'
      });
    }
    console.error('❌ Conversation get error:', error);
    next(error);
  }
});

/**
 * POST /api/conversations
 * Yeni konuşma oluştur
 */
router.post('/', conversationLimiter, async (req, res, next) => {
  try {
    await ensureStorageExists();

    const { title, messages } = req.body;
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conversation = {
      id: conversationId,
      title: title || 'Yeni Sohbet',
      messages: messages || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const filePath = path.join(STORAGE_PATH, `${conversationId}.json`);
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));

    console.log(`✅ Conversation created: ${conversationId}`);

    res.json({
      success: true,
      conversation: conversation
    });

  } catch (error) {
    console.error('❌ Conversation create error:', error);
    next(error);
  }
});

/**
 * PUT /api/conversations/:id
 * Konuşmayı güncelle
 */
router.put('/:id', conversationLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { messages, title } = req.body;

    const filePath = path.join(STORAGE_PATH, `${id}.json`);

    // Mevcut konuşmayı oku
    const data = await fs.readFile(filePath, 'utf8');
    const conversation = JSON.parse(data);

    // Güncelle
    if (messages) conversation.messages = messages;
    if (title) conversation.title = title;
    conversation.updatedAt = Date.now();

    // Kaydet
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));

    console.log(`✅ Conversation updated: ${id}`);

    res.json({
      success: true,
      conversation: conversation
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
        message: 'Konuşma bulunamadı'
      });
    }
    console.error('❌ Conversation update error:', error);
    next(error);
  }
});

/**
 * DELETE /api/conversations/:id
 * Konuşmayı sil
 */
router.delete('/:id', conversationLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const filePath = path.join(STORAGE_PATH, `${id}.json`);

    await fs.unlink(filePath);

    console.log(`🗑️ Conversation deleted: ${id}`);

    res.json({
      success: true,
      message: 'Konuşma silindi',
      deletedId: id
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
        message: 'Konuşma bulunamadı'
      });
    }
    console.error('❌ Conversation delete error:', error);
    next(error);
  }
});

/**
 * POST /api/conversations/:id/messages
 * Konuşmaya mesaj ekle
 */
router.post('/:id/messages', conversationLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MESSAGE',
        message: 'role ve content gerekli'
      });
    }

    const filePath = path.join(STORAGE_PATH, `${id}.json`);

    // Konuşmayı oku
    const data = await fs.readFile(filePath, 'utf8');
    const conversation = JSON.parse(data);

    // Mesaj ekle
    const message = {
      role: role,
      content: content,
      timestamp: Date.now()
    };

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();

    // Kaydet
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));

    res.json({
      success: true,
      message: message,
      conversationId: id
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
        message: 'Konuşma bulunamadı'
      });
    }
    console.error('❌ Add message error:', error);
    next(error);
  }
});

module.exports = router;
