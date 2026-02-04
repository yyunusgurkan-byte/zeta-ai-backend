// 🛡️ SAFETY FILTER
// Zararlı içerik ve spam kontrolü (Claude'un Constitutional AI'ına benzer)

class SafetyFilter {
  constructor() {
    // Yasaklı kelimeler
    this.bannedWords = [
      'bomba', 'patlayıcı', 'cinayet', 'uyuşturucu',
      'hack', 'exploit', 'malware', 'virus',
      'porn', 'illegal', 'kaçak'
    ];

    // Spam pattern'leri
    this.spamPatterns = [
      /(.)\1{10,}/,           // Aynı karakter 10+ kez
      /http[s]?:\/\/.{100,}/, // Çok uzun URL
      /[A-Z]{20,}/            // 20+ büyük harf üst üste
    ];

    // Rate limiting için basit counter (in-memory)
    this.requestCounts = new Map();
    this.RATE_WINDOW = 60000; // 1 dakika
    this.MAX_REQUESTS = 30;   // Dakikada max 30 istek
  }

  /**
   * Ana güvenlik kontrolü
   * @param {string} message - Kullanıcı mesajı
   * @param {string} userId - Kullanıcı ID (opsiyonel)
   * @returns {Object} - { safe: boolean, message?: string, reason?: string }
   */
  check(message, userId = 'default') {
    // 1. Boş mesaj kontrolü
    if (!message || message.trim().length === 0) {
      return {
        safe: false,
        message: '⚠️ Mesaj boş olamaz.',
        reason: 'empty_message'
      };
    }

    // 2. Çok uzun mesaj (spam prevention)
    if (message.length > 10000) {
      return {
        safe: false,
        message: '⚠️ Mesaj çok uzun. Lütfen 10.000 karakterin altında tutun.',
        reason: 'message_too_long'
      };
    }

    // 3. Çok kısa tekrarlı mesajlar
    if (message.trim().length < 2) {
      return {
        safe: false,
        message: '⚠️ Mesaj çok kısa.',
        reason: 'message_too_short'
      };
    }

    // 4. Yasaklı kelime kontrolü
    const bannedCheck = this.checkBannedWords(message);
    if (!bannedCheck.safe) {
      return bannedCheck;
    }

    // 5. Spam pattern kontrolü
    const spamCheck = this.checkSpamPatterns(message);
    if (!spamCheck.safe) {
      return spamCheck;
    }

    // 6. Rate limiting kontrolü
    const rateLimitCheck = this.checkRateLimit(userId);
    if (!rateLimitCheck.safe) {
      return rateLimitCheck;
    }

    // ✅ Güvenli
    return { safe: true };
  }

  /**
   * Yasaklı kelime kontrolü
   */
  checkBannedWords(message) {
    const lowerMessage = message.toLowerCase();

    for (const word of this.bannedWords) {
      if (lowerMessage.includes(word)) {
        console.warn(`🚫 Banned word detected: ${word}`);
        return {
          safe: false,
          message: '⚠️ Bu içerik güvenlik nedeniyle engellendi.',
          reason: 'banned_content'
        };
      }
    }

    return { safe: true };
  }

  /**
   * Spam pattern kontrolü
   */
  checkSpamPatterns(message) {
    for (const pattern of this.spamPatterns) {
      if (pattern.test(message)) {
        console.warn('🚫 Spam pattern detected');
        return {
          safe: false,
          message: '⚠️ Spam içerik tespit edildi.',
          reason: 'spam_detected'
        };
      }
    }

    return { safe: true };
  }

  /**
   * Rate limiting kontrolü (basit in-memory)
   */
  checkRateLimit(userId) {
    const now = Date.now();
    
    // Kullanıcının mevcut request sayısını al
    if (!this.requestCounts.has(userId)) {
      this.requestCounts.set(userId, []);
    }

    const userRequests = this.requestCounts.get(userId);

    // Eski istekleri temizle (1 dakikadan eski)
    const recentRequests = userRequests.filter(timestamp => {
      return now - timestamp < this.RATE_WINDOW;
    });

    // Limit kontrolü
    if (recentRequests.length >= this.MAX_REQUESTS) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = Math.ceil((this.RATE_WINDOW - (now - oldestRequest)) / 1000);

      console.warn(`🚫 Rate limit exceeded for user: ${userId}`);
      return {
        safe: false,
        message: `⏳ **Çok fazla istek gönderdiniz!**\n\nLütfen ${waitTime} saniye bekleyin.`,
        reason: 'rate_limit_exceeded'
      };
    }

    // Yeni isteği kaydet
    recentRequests.push(now);
    this.requestCounts.set(userId, recentRequests);

    return { safe: true };
  }

  /**
   * Yasaklı kelime ekle (dinamik)
   */
  addBannedWord(word) {
    if (!this.bannedWords.includes(word.toLowerCase())) {
      this.bannedWords.push(word.toLowerCase());
      console.log(`🚫 Added banned word: ${word}`);
    }
  }

  /**
   * Rate limit'i sıfırla
   */
  resetRateLimit(userId) {
    this.requestCounts.delete(userId);
    console.log(`🔄 Rate limit reset for: ${userId}`);
  }

  /**
   * İstatistikler
   */
  getStats() {
    return {
      bannedWordsCount: this.bannedWords.length,
      trackedUsers: this.requestCounts.size,
      totalRequests: Array.from(this.requestCounts.values()).reduce((sum, requests) => sum + requests.length, 0)
    };
  }
}

module.exports = SafetyFilter;
