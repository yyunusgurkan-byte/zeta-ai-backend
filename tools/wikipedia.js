// 📚 WIKIPEDIA TOOL
// Türkçe Wikipedia'dan bilgi çeker

const axios = require('axios');

module.exports = {
  name: 'wikipedia',
  description: 'Wikipedia\'dan bilgi getirir',

  /**
   * Wikipedia araması yap
   * @param {Object} params - { query: string }
   */
  async execute({ query }) {
    try {
      console.log(`📚 Wikipedia searching: "${query}"`);

      // Query'yi temizle
      const cleanQuery = query
        .replace(/nedir|kimdir|ne demek|hakkında|bilgi ver|ne dir|kim dir/gi, '')
        .replace(/[?!.,]/g, '')
        .trim();

      if (cleanQuery.length < 2) {
        return {
          success: false,
          error: 'Arama terimi çok kısa'
        };
      }

      // Wikipedia REST API çağrısı
      const url = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
      
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'ZetaAI/1.0'
        }
      });

      const data = response.data;

      // Başarılı sonuç
      return {
        success: true,
        data: {
          title: data.title,
          extract: data.extract,
          url: data.content_urls?.desktop?.page,
          thumbnail: data.thumbnail?.source || data.originalimage?.source || null,
          description: data.description || null
        }
      };

    } catch (error) {
      console.error('❌ Wikipedia error:', error.message);

      // 404 - Sayfa bulunamadı
      if (error.response?.status === 404) {
        return {
          success: false,
          error: `"${query}" için Wikipedia sayfası bulunamadı.`
        };
      }

      // Diğer hatalar
      return {
        success: false,
        error: 'Wikipedia sorgusu başarısız oldu.'
      };
    }
  }
};
