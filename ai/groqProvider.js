// 🤖 GROQ + OLLAMA AI PROVIDER
const axios = require('axios');
require('dotenv').config();

class GroqProvider {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.fallbackKey = process.env.FALLBACK_API_KEY;
    this.model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
    this.fallbackModel = process.env.FALLBACK_MODEL || 'llama-3.1-8b-instant';
    this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';

    // Ollama ayarları
    this.ollamaURL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
    this.useOllama = process.env.USE_OLLAMA === 'true'; // .env'de USE_OLLAMA=true ile aktif et

    if (!this.apiKey && !this.fallbackKey) {
      console.error('❌ GROQ API KEY bulunamadı!');
    } else {
      console.log('✅ GROQ Provider initialized:', this.apiKey ? 'Primary Key' : 'Fallback Key');
    }

    if (this.useOllama) {
      console.log(`🦙 Ollama aktif: ${this.ollamaURL} (${this.ollamaModel})`);
    }
  }

  async chat(conversationHistory = [], userMessage = '', systemPrompt = null) {
    const messages = this.prepareMessages(conversationHistory, userMessage, systemPrompt);

    // Lokalde USE_OLLAMA=true ise önce Ollama dene
    if (this.useOllama) {
      try {
        const response = await this.chatWithOllama(messages);
        console.log('🦙 Ollama yanıt verdi');
        return response;
      } catch (ollamaErr) {
        console.warn('⚠️ Ollama başarısız, Groq\'a geçiliyor:', ollamaErr.message);
      }
    }

    // Groq ile dene
    try {
      return await this.chatWithGroq(messages, this.apiKey, this.model);
    } catch (error) {
      // Rate limit veya hata → fallback key dene
      if (this.fallbackKey && error.message === 'RATE_LIMIT_EXCEEDED') {
        console.warn('⚠️ Rate limit, fallback key deneniyor...');
        try {
          return await this.chatWithGroq(messages, this.fallbackKey, this.fallbackModel);
        } catch (fallbackErr) {
          console.error('❌ Fallback key de başarısız:', fallbackErr.message);
        }
      }

      // Son çare: Ollama (USE_OLLAMA=false olsa bile)
      try {
        console.warn('⚠️ Groq başarısız, Ollama deneniyor...');
        return await this.chatWithOllama(messages);
      } catch (ollamaErr) {
        console.error('❌ Ollama da başarısız:', ollamaErr.message);
        throw this.handleError(error);
      }
    }
  }

  async chatWithGroq(messages, apiKey, model) {
    if (!apiKey) throw new Error('GROQ_API_KEY_MISSING');

    console.log(`🤖 GROQ API çağrısı: ${messages.length} mesaj, model: ${model}`);

    const response = await axios.post(this.baseURL, {
      model,
      messages,
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
    console.log(`✅ GROQ yanıt: ${aiResponse.length} karakter`);
    return aiResponse;
  }

  async chatWithOllama(messages) {
    console.log(`🦙 Ollama API çağrısı: model: ${this.ollamaModel}`);

    const response = await axios.post(this.ollamaURL, {
      model: this.ollamaModel,
      messages,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 3000
      }
    }, {
      timeout: 60000 // Ollama daha yavaş olabilir
    });

    const aiResponse = response.data.message?.content || 'Yanıt oluşturulamadı.';
    console.log(`✅ Ollama yanıt: ${aiResponse.length} karakter`);
    return aiResponse;
  }

  prepareMessages(history, userMessage, systemPrompt) {
    const messages = [];

    messages.push({
      role: 'system',
      content: systemPrompt?.trim() || this.buildDefaultSystemPrompt()
    });

    if (Array.isArray(history) && history.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    if (userMessage?.trim()) {
      messages.push({ role: 'user', content: userMessage });
    }

    return messages;
  }

  buildDefaultSystemPrompt() {
    return `Sen Zeta, süper zekalı, sevecen, çok akıllı yardımcı bir AI asistansın.

KİMLİĞİN:
- İsmin: Zeta
- Görevin: Kullanıcılara her konuda yardımcı olmak
- Dil: Kullanıcı hangi dilde yazarsa o dilde yanıt ver
- Türkçe yazarsa Türkçe, İngilizce yazarsa İngilizce cevap ver

BAĞLAM KURALLARI (ÇOK ÖNEMLİ):
- Konuşma geçmişini DAIMA takip et
- Kullanıcının önceki mesajlarına atıfta bulun
- Konu değiştiğinde bunu fark et ve yeni konuya odaklan
- Önceki konuya ait bilgileri yeni konuya karıştırma
- Kullanıcı "o", "bu", "şu" dediğinde geçmişten bağlamı anla

KENDİNİ GELİŞTİRME KURALLARI:
- Bilgin güncel değilse veya emin değilsen web arama aracını kullan
- Her etkileşimde kullanıcıya daha yardımsever olmaya çalış
- Kullanıcı hata yaparsa nazikçe düzelt, küçümseme
- Yanlış bilgi verdiğinde bunu kabul et ve düzelt


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
    if (error.response?.status === 429) return new Error('RATE_LIMIT_EXCEEDED');
    if (error.response?.status === 401) return new Error('INVALID_API_KEY');
    if (error.code === 'ECONNABORTED') return new Error('REQUEST_TIMEOUT');
    return new Error(error.message || 'UNKNOWN_ERROR');
  }

  getModelInfo() {
    return {
      model: this.useOllama ? this.ollamaModel : (this.apiKey ? this.model : this.fallbackModel),
      provider: this.useOllama ? 'OLLAMA' : 'GROQ',
      keyType: this.apiKey ? 'primary' : 'fallback',
      available: !!(this.apiKey || this.fallbackKey || this.useOllama)
    };
  }
}

module.exports = GroqProvider;