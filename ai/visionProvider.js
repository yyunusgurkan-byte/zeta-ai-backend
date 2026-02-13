// 🖼️ OPENAI VISION PROVIDER
// GPT-4 Vision ile resim analizi

const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

class VisionProvider {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = 'gpt-4o'; // GPT-4 Omni (vision + text)
    this.baseURL = 'https://api.openai.com/v1/chat/completions';

    if (!this.apiKey) {
      console.warn('⚠️ OPENAI_API_KEY bulunamadı! Vision özelliği çalışmayacak.');
    } else {
      console.log('✅ Vision Provider initialized');
    }
  }

  /**
   * Resmi analiz et
   * @param {string} imagePath - Resim dosya yolu veya URL
   * @param {string} userPrompt - Kullanıcının sorusu
   * @returns {Promise<string>} - AI yanıtı
   */
  async analyzeImage(imagePath, userPrompt = "Bu resimde ne var? Türkçe detaylı açıkla.") {
    try {
      if (!this.apiKey) {
        throw new Error('OPENAI_API_KEY eksik! Vision kullanılamıyor.');
      }

      let imageContent;

      // URL mi yoksa local dosya mı?
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        imageContent = {
          type: "image_url",
          image_url: {
            url: imagePath
          }
        };
      } else {
        // Local dosyayı base64'e çevir
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const ext = imagePath.split('.').pop().toLowerCase();
        const mimeType = this.getMimeType(ext);

        imageContent = {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        };
      }

      console.log('🖼️ Vision API çağrısı başlatılıyor...');

      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          {
            role: "system",
            content: "Sen Zeta, Türkçe konuşan bir AI asistansın. Resimleri detaylı ve Türkçe olarak açıklarsın."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              imageContent
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log(`✅ Vision yanıt alındı: ${aiResponse.length} karakter`);

      return aiResponse;

    } catch (error) {
      console.error('❌ Vision API hatası:', error.response?.data || error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Dosya uzantısına göre MIME type döndür
   */
  getMimeType(ext) {
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Hata yönetimi
   */
  handleError(error) {
    if (error.response?.status === 429) {
      return new Error('RATE_LIMIT_EXCEEDED: Vision API limiti aşıldı');
    }
    if (error.response?.status === 401) {
      return new Error('INVALID_API_KEY: OpenAI API key geçersiz');
    }
    if (error.code === 'ECONNABORTED') {
      return new Error('REQUEST_TIMEOUT: Vision API zaman aşımı');
    }
    return new Error(error.message || 'VISION_ERROR: Bilinmeyen hata');
  }

  /**
   * Vision özelliği kullanılabilir mi?
   */
  isAvailable() {
    return !!this.apiKey;
  }
}

module.exports = VisionProvider;
