// 🤖 GROQ AI PROVIDER
const axios = require('axios');

// .env dosyasını yükle
require('dotenv').config();

class GroqProvider {
  constructor() {
   this.apiKey = process.env.GROQ_API_KEY;
this.fallbackKey = process.env.FALLBACK_API_KEY;
this.model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
this.fallbackModel = process.env.FALLBACK_MODEL || 'llama-3.1-8b-instant';
this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';

    if (!this.apiKey && !this.fallbackKey) {
      console.error('❌ GROQ API KEY bulunamadı! .env dosyanızı kontrol edin.');
    } else {
      console.log('✅ GROQ Provider initialized:', this.apiKey ? 'Primary Key' : 'Fallback Key');
    }
  }

  async chat(conversationHistory = [], userMessage = '', systemPrompt = null) {
    try {
      const apiKey = this.apiKey || this.fallbackKey;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY_MISSING');
      }

      const model = this.apiKey ? this.model : this.fallbackModel;
      const messages = this.prepareMessages(conversationHistory, userMessage, systemPrompt);

      console.log(`🤖 GROQ API çağrısı: ${messages.length} mesaj, model: ${model}`);

      const response = await axios.post(this.baseURL, {
        model: model,
        messages: messages,
        temperature: 0.2,
        max_tokens: 3000,
        top_p: 1,
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      });

      const aiResponse = response.data.choices[0].message.content || 'Yanıt oluşturulamadı.';
      console.log(`✅ GROQ yanıt alındı: ${aiResponse.length} karakter`);
      
      return aiResponse;

    } catch (error) {
      console.error('❌ GROQ API hatası:', error.message);
      throw this.handleError(error);
    }
  }

  prepareMessages(history, userMessage, systemPrompt) {
    const messages = [];

    if (systemPrompt && systemPrompt.trim()) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    } else {
      messages.push({
        role: 'system',
        content: this.buildDefaultSystemPrompt()
      });
    }

    if (history && Array.isArray(history) && history.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    if (userMessage && userMessage.trim()) {
      messages.push({
        role: 'user',
        content: userMessage
      });
    }

    return messages;
  }

 buildDefaultSystemPrompt() {
  return `Sen Zeta, süper zekalı, sevecen, çok akıllı yardımcı bir AI asistansın.

KİMLİĞİN:
- İsmin: Zeta
- Görevin: Kullanıcılara her konuda yardımcı olmak
- Dil: SADECE TÜRKÇE

BAĞLAM KURALLARI (ÇOK ÖNEMLİ):
- Konuşma geçmişini DAIMA takip et
- Kullanıcının önceki mesajlarına atıfta bulun
- Konu değiştiğinde bunu fark et ve yeni konuya odaklan
- Önceki konuya ait bilgileri yeni konuya karıştırma
- Kullanıcı "o", "bu", "şu" dediğinde geçmişten bağlamı anla

KOD YAZARKEN ZORUNLU KURALLAR:
- Kod bloklarını MUTLAKA doğru dil etiketiyle yaz
- package.json analiz ederken SADECE hatalı satırları listele, uzun açıklama yapma
- Hatalı kodlarda hatanın NEDENİNİ açıkla, sadece düzeltme yapma dene de 
- yeni kodu hatasız oluştur ver yine hata olursa analiz et hataları ayıkla düzelt ver
- HTML kodu için: \`\`\`html
- JavaScript kodu için: \`\`\`javascript
- CSS kodu için: \`\`\`css
- Python kodu için: \`\`\`python
- HİÇBİR ZAMAN yanlış etiket kullanma (JS kodunu css olarak etiketleme!)
- Eğer hem HTML hem JS varsa, ayrı ayrı bloklar halinde yaz

GENEL KURALLAR:
- SADECE Türkçe yaz
- Kısa ve net yanıtlar ver
- Samimi ama profesyonel ol

YETENEKLERIN:
- Genel bilgi ve sohbet
- Kod yazma ve açıklama
- Hava durumu sorgulama
- Wikipedia araması
- Web araması
- Matematik hesaplamaları`;
}

  handleError(error) {
    if (error.response?.status === 429) {
      return new Error('RATE_LIMIT_EXCEEDED');
    }
    if (error.response?.status === 401) {
      return new Error('INVALID_API_KEY');
    }
    if (error.code === 'ECONNABORTED') {
      return new Error('REQUEST_TIMEOUT');
    }
    return new Error(error.message || 'UNKNOWN_ERROR');
  }

  getModelInfo() {
    return {
      model: this.apiKey ? this.model : this.fallbackModel,
      provider: 'GROQ',
      keyType: this.apiKey ? 'primary' : 'fallback',
      available: !!(this.apiKey || this.fallbackKey)
    };
  }
}

module.exports = GroqProvider;