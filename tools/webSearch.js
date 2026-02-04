// 🌐 WEB SEARCH TOOL
// Google arama yapar (Ücretsiz DuckDuckGo API kullanarak)

const axios = require('axios');

module.exports = {
  name: 'webSearch',
  description: 'Web üzerinde arama yapar',

  /**
   * Web araması yap
   * @param {Object} params - { query: string }
   */
  async execute({ query }) {
    try {
      console.log(`🌐 Web searching: "${query}"`);

      // DuckDuckGo Instant Answer API (ücretsiz, API key gerektirmez)
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
      
      const response = await axios.get(ddgUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'ZetaAI/1.0'
        }
      });

      const data = response.data;

      // RelatedTopics'ten sonuçları topla
      const results = [];

      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL || null,
          source: 'DuckDuckGo'
        });
      }

      // Related topics ekle
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 5).forEach(topic => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.substring(0, 100),
              snippet: topic.Text,
              url: topic.FirstURL,
              source: 'DuckDuckGo'
            });
          }
        });
      }

      if (results.length === 0) {
        return {
          success: false,
          error: 'Sonuç bulunamadı'
        };
      }

      return {
        success: true,
        data: {
          query: query,
          results: results,
          count: results.length
        }
      };

    } catch (error) {
      console.error('❌ Web search error:', error.message);
      return {
        success: false,
        error: 'Arama yapılamadı'
      };
    }
  }
};
