// 💾 CONTEXT MANAGER
// Konuşma geçmişini yönetir ve token limitine göre optimize eder

class ContextManager {
  constructor() {
    this.MAX_TOKENS = 16000;          // Llama 3.1 context limit
    this.SYSTEM_PROMPT_TOKENS = 500;  // Sistem promptu için rezerve
    this.RESPONSE_RESERVE = 1500;     // Yanıt için rezerve
    this.CHARS_PER_TOKEN = 4;         // Yaklaşık token hesabı
  }

  /**
   * Konuşma geçmişini hazırla
   * @param {Array} conversationHistory - Tüm mesaj geçmişi
   * @returns {Array} - Optimize edilmiş mesaj dizisi
   */
  prepare(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return [];
    }

    // Kullanılabilir token sayısı
    const availableTokens = this.MAX_TOKENS - this.SYSTEM_PROMPT_TOKENS - this.RESPONSE_RESERVE;

    // Son mesajları al (token limitine uygun)
    const recentMessages = this.getRecentMessages(conversationHistory, availableTokens);

    console.log(`💾 Context prepared: ${recentMessages.length} messages (estimated ${this.estimateTotalTokens(recentMessages)} tokens)`);

    return recentMessages;
  }

  /**
   * Son N mesajı token limitine göre al
   */
  getRecentMessages(history, maxTokens) {
    const messages = [];
    let currentTokens = 0;

    // Geriye doğru git (en yeni mesajlardan başla)
    for (let i = history.length - 1; i >= 0; i--) {
      const message = history[i];
      const messageTokens = this.estimateTokens(message.content);

      // Token limiti aşılacaksa dur
      if (currentTokens + messageTokens > maxTokens) {
        break;
      }

      messages.unshift(message); // Başa ekle (sıralama için)
      currentTokens += messageTokens;
    }

    return messages;
  }

  /**
   * Metin için token sayısını tahmin et
   * Yaklaşık hesaplama: 1 token ≈ 4 karakter
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Tüm mesajlar için toplam token tahmini
   */
  estimateTotalTokens(messages) {
    return messages.reduce((total, msg) => {
      return total + this.estimateTokens(msg.content);
    }, 0);
  }

  /**
   * Mesajları formatla (AI için)
   */
  formatForAI(messages) {
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  /**
   * Context'i özetle (uzun konuşmalar için)
   * Gelecekte ekleme: Eski mesajları özetleme
   */
  async summarizeOldMessages(messages) {
    // TODO: Çok uzun konuşmalarda eski mesajları özetleyebiliriz
    // Örneğin ilk 10 mesajı "Kullanıcı X hakkında sordu, ben Y dedim" şeklinde
    return messages;
  }

  /**
   * Önemli bilgileri tespit et ve önceliklendir
   */
  prioritizeImportant(messages) {
    // TODO: Dosya referansları, kod blokları gibi önemli bilgileri önceliklendir
    return messages;
  }
}

module.exports = ContextManager;
