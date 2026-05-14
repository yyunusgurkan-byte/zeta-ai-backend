const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// TEST ENDPOINT
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Upload route çalışıyor!' });
});

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files allowed!'));
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('📥 Upload request received');

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Dosya yüklenmedi' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;
    const userPrompt = req.body.prompt || 'Bu resimde ne var? Türkçe detaylı açıkla.';

    // Groq vision-preview modeli ile analiz
    const apiKey = process.env.GROQ_API_KEY || process.env.FALLBACK_API_KEY;
    if (!apiKey) throw new Error('API key bulunamadı');

    console.log('🖼️ Resim analiz ediliyor...');

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: userPrompt
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000
    });

    const analysis = response.data.choices[0].message.content;
    console.log('✅ Resim analizi tamamlandı');

    res.json({
      success: true,
      analysis,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('❌ Upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;