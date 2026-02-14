// 🌍 LANGUAGE DETECTOR - Basit Dil Algılama Sistemi

/**
 * Metindeki dili algıla
 * @param {string} text - Analiz edilecek metin
 * @returns {string} - Dil kodu (tr, en, de, vb.)
 */
function detectLanguage(text) {
  if (!text || text.trim().length === 0) {
    return 'en'; // Varsayılan
  }

  const lowerText = text.toLowerCase();

  // 🇹🇷 Türkçe - Öncelikli kontrol (ana dil)
  if (/[çğıöşüÇĞİÖŞÜ]/.test(text)) {
    return 'tr';
  }

  // 🇸🇦 Arapça
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar';
  }

  // 🇨🇳 Çince
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return 'zh';
  }

  // 🇯🇵 Japonca (Hiragana + Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return 'ja';
  }

  // 🇰🇷 Korece
  if (/[\uAC00-\uD7AF]/.test(text)) {
    return 'ko';
  }

  // 🇷🇺 Rusça (Kiril)
  if (/[а-яА-ЯЁё]/.test(text)) {
    return 'ru';
  }

  // 🇬🇷 Yunanca
  if (/[\u0370-\u03FF]/.test(text)) {
    return 'el';
  }

  // 🇩🇪 Almanca (ß, ä, ö, ü)
  if (/[ßäöüÄÖÜ]/.test(text)) {
    return 'de';
  }

  // 🇫🇷 Fransızca (özel karakterler)
  if (/[àâäæçéèêëïîôùûüÿœÀÂÄÆÇÉÈÊËÏÎÔÙÛÜŸŒ]/.test(text)) {
    return 'fr';
  }

  // 🇪🇸 İspanyolca (ñ, ¿, ¡)
  if (/[ñáéíóúüÑÁÉÍÓÚÜ¿¡]/.test(text)) {
    return 'es';
  }

  // 🇮🇹 İtalyanca (à, è, ì, ò, ù)
  if (/[àèìòùÀÈÌÒÙ]/.test(text) && !lowerText.includes('français')) {
    return 'it';
  }

  // Kelime bazlı algılama (fallback)
  const languageKeywords = {
    tr: ['merhaba', 'nasılsın', 'teşekkür', 'lütfen', 'evet', 'hayır'],
    en: ['hello', 'thank', 'please', 'yes', 'how', 'what'],
    de: ['hallo', 'danke', 'bitte', 'ja', 'nein', 'wie'],
    fr: ['bonjour', 'merci', 'oui', 'non', 'comment'],
    es: ['hola', 'gracias', 'por favor', 'sí', 'cómo'],
    it: ['ciao', 'grazie', 'per favore', 'sì', 'come'],
    ru: ['привет', 'спасибо', 'да', 'нет', 'как'],
    ar: ['مرحبا', 'شكرا', 'نعم', 'لا'],
    pt: ['olá', 'obrigado', 'sim', 'não', 'como'],
    nl: ['hallo', 'dank', 'ja', 'nee', 'hoe']
  };

  for (const [lang, keywords] of Object.entries(languageKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return lang;
    }
  }

  // Varsayılan İngilizce
  return 'en';
}

/**
 * Dil kodunu tam isme çevir
 */
const LANGUAGE_NAMES = {
  tr: '🇹🇷 Türkçe',
  en: '🇬🇧 English',
  de: '🇩🇪 Deutsch',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Español',
  it: '🇮🇹 Italiano',
  ru: '🇷🇺 Русский',
  ar: '🇸🇦 العربية',
  zh: '🇨🇳 中文',
  ja: '🇯🇵 日本語',
  ko: '🇰🇷 한국어',
  nl: '🇳🇱 Nederlands',
  pt: '🇵🇹 Português',
  el: '🇬🇷 Ελληνικά',
  hi: '🇮🇳 हिन्दी'
};

/**
 * Desteklenen dilleri listele
 */
function getSupportedLanguages() {
  return Object.keys(LANGUAGE_NAMES);
}

/**
 * Dil bilgisi al
 */
function getLanguageInfo(langCode) {
  return {
    code: langCode,
    name: LANGUAGE_NAMES[langCode] || '🌍 Unknown',
    supported: LANGUAGE_NAMES.hasOwnProperty(langCode)
  };
}

module.exports = {
  detectLanguage,
  LANGUAGE_NAMES,
  getSupportedLanguages,
  getLanguageInfo
};