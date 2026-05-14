// 🌐 ENHANCED WEB SEARCH TOOL - Tavily Edition
const axios = require('axios');

module.exports = {
  name: 'webSearch',
  description: 'İnternet üzerinden güncel haberler, tanımlar ve teknik bilgiler arar.',
  
  async execute({ query }) {
    try {
      console.log(`🌐 Tavily Searching: "${query}"`);
      
      const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
      
      if (!TAVILY_API_KEY) {
        return { success: false, error: 'TAVILY_API_KEY tanımlı değil' };
      }

      const response = await axios.post('https://api.tavily.com/search', {
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: "advanced", // Daha derin ve kaliteli sonuçlar için
        max_results: 5,
        include_answer: true // Yapay zekanın hızlı cevap alması için
      }, { timeout: 15000 });

      const data = response.data;

      // Sonuçları Zeta'nın anlayacağı formata sokuyoruz
      const results = {
        query: query,
        directAnswer: data.answer || null,
        organic: data.results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
          score: r.score
        }))
      };

      if (results.organic.length === 0 && !results.directAnswer) {
        return { success: false, error: 'İnternette ilgili bir sonuç bulunamadı.' };
      }

      return { success: true, data: results };

    } catch (error) {
      console.error('❌ Tavily Search Error:', error.message);
      return { success: false, error: 'Arama sırasında bir hata oluştu.' };
    }
  }
};