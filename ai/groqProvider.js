// 🤖 GROQ PROVIDER - Güncellenmiş Versiyon
// Çoklu dil desteği ile

const Groq = require('groq-sdk');
const SYSTEM_PROMPT = require('./systemPrompt'); // Yeni sistem prompt'u import et

class GroqProvider {
  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    this.model = 'llama-3.3-70b-versatile'; // veya 'llama-3.1-70b-versatile'
    
    console.log('🤖 GROQ Provider initialized with multi-language support');
  }

  /**
   * Chat completion - Çoklu dil destekli
   * @param {Array} conversationHistory - Konuşma geçmişi
   * @param {string} userMessage - Kullanıcı mesajı
   * @param {string} detectedLang - Algılanan dil (opsiyonel)
   * @returns {Promise<string>} - AI yanıtı
   */
  async chat(conversationHistory, userMessage, detectedLang = 'tr') {
    try {
      // Mesajları hazırla
      const messages = [
        {
          role: 'system',
          content: SYSTEM_PROMPT // Çoklu dil destekli prompt
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      console.log(`🌍 Sending request to GROQ (detected lang: ${detectedLang})`);

      // GROQ API çağrısı
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7, // Yaratıcılık dengesi
        max_tokens: 2048,
        top_p: 0.9,
        stream: false
      });

      const response = completion.choices[0]?.message?.content || 'Yanıt alınamadı.';
      
      console.log(`✅ Response received (${response.length} chars)`);
      
      return response;

    } catch (error) {
      console.error('❌ GROQ API Error:', error.message);
      
      // Dil bazlı hata mesajları
      const errorMessages = {
        tr: '❌ Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.',
        en: '❌ Sorry, I cannot respond right now. Please try again.',
        de: '❌ Entschuldigung, ich kann derzeit nicht antworten. Bitte versuchen Sie es erneut.',
        es: '❌ Lo siento, no puedo responder ahora. Por favor, inténtalo de nuevo.',
        fr: '❌ Désolé, je ne peux pas répondre maintenant. Veuillez réessayer.'
      };
      
      return errorMessages[detectedLang] || errorMessages['en'];
    }
  }

  /**
   * Streaming chat (gelecekte eklenebilir)
   */
  async chatStream(conversationHistory, userMessage) {
    // TODO: Streaming implementation
    throw new Error('Streaming not implemented yet');
  }

  /**
   * Model bilgisini al
   */
  getModelInfo() {
    return {
      model: this.model,
      provider: 'GROQ',
      multiLanguage: true,
      supportedLanguages: 15
    };
  }
}

module.exports = GroqProvider;