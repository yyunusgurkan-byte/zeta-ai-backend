// 🌐 WEB SEARCH TOOL - ENHANCED VERSION
// SerpAPI ile güçlendirilmiş web araması (resim, haber, video, knowledge graph)

const axios = require('axios');

/**
 * Resim sonuçlarını işle
 */
function processImages(data) {
  const images = [];
  
  if (data.images_results && data.images_results.length > 0) {
    data.images_results.slice(0, 6).forEach(img => {
      images.push({
        title: img.title || 'Resim',
        thumbnail: img.thumbnail,
        original: img.original,
        source: img.source,
        link: img.link
      });
    });
  }
  
  return images.length > 0 ? images : null;
}

/**
 * Haber sonuçlarını işle
 */
function processNews(data) {
  const news = [];
  
  if (data.news_results && data.news_results.length > 0) {
    data.news_results.slice(0, 5).forEach(article => {
      news.push({
        title: article.title,
        snippet: article.snippet || article.description || '',
        source: article.source,
        date: article.date,
        link: article.link,
        thumbnail: article.thumbnail
      });
    });
  }
  
  return news.length > 0 ? news : null;
}

/**
 * Video sonuçlarını işle
 */
function processVideos(data) {
  const videos = [];
  
  if (data.video_results && data.video_results.length > 0) {
    data.video_results.slice(0, 4).forEach(video => {
      videos.push({
        title: video.title,
        channel: video.channel || video.source,
        duration: video.duration,
        date: video.date,
        thumbnail: video.thumbnail,
        link: video.link
      });
    });
  }
  
  return videos.length > 0 ? videos : null;
}

/**
 * Knowledge Graph işle
 */
function processKnowledgeGraph(data) {
  if (!data.knowledge_graph) return null;
  
  const kg = data.knowledge_graph;
  
  return {
    title: kg.title,
    type: kg.type,
    description: kg.description,
    image: kg.image || kg.thumbnail,
    attributes: kg.attributes || {},
    source: kg.source,
    profiles: kg.profiles || null // Social media profilleri
  };
}

/**
 * İlgili aramaları işle
 */
function processRelatedSearches(data) {
  const related = [];
  
  if (data.related_searches && data.related_searches.length > 0) {
    data.related_searches.slice(0, 5).forEach(search => {
      related.push({
        query: search.query,
        link: search.link
      });
    });
  }
  
  return related.length > 0 ? related : null;
}

/**
 * Yerel sonuçları işle
 */
function processLocalResults(data) {
  const local = [];
  
  if (data.local_results && data.local_results.length > 0) {
    data.local_results.slice(0, 3).forEach(place => {
      local.push({
        title: place.title,
        rating: place.rating,
        reviews: place.reviews,
        address: place.address,
        phone: place.phone,
        hours: place.hours,
        type: place.type,
        link: place.link
      });
    });
  }
  
  return local.length > 0 ? local : null;
}

/**
 * Shopping sonuçlarını işle
 */
function processShopping(data) {
  const shopping = [];
  
  if (data.shopping_results && data.shopping_results.length > 0) {
    data.shopping_results.slice(0, 4).forEach(product => {
      shopping.push({
        title: product.title,
        price: product.price,
        source: product.source,
        rating: product.rating,
        reviews: product.reviews,
        thumbnail: product.thumbnail,
        link: product.link
      });
    });
  }
  
  return shopping.length > 0 ? shopping : null;
}

module.exports = {
  name: 'webSearch',
  description: 'Gelişmiş web araması (resim, haber, video, bilgi kutusu)',
  
  /**
   * Web araması yap
   * @param {Object} params - { query: string, type: 'all'|'images'|'news'|'videos' }
   */
  async execute({ query, type = 'all' }) {
    try {
      console.log(`🌐 SerpAPI searching: "${query}" (type: ${type})`);
      
      const SERP_API_KEY = process.env.SERP_API_KEY;
      
      if (!SERP_API_KEY) {
        return {
          success: false,
          error: 'SERP_API_KEY tanımlı değil'
        };
      }

      // Ana arama parametreleri
      const searchParams = {
        q: query,
        api_key: SERP_API_KEY,
        engine: 'google',
        hl: 'tr',
        gl: 'tr',
        num: 10
      };

      // Tip bazlı parametreler
      if (type === 'images') {
        searchParams.tbm = 'isch'; // Image search
        searchParams.num = 20;
      } else if (type === 'news') {
        searchParams.tbm = 'nws'; // News search
      } else if (type === 'videos') {
        searchParams.tbm = 'vid'; // Video search
      }

      const response = await axios.get('https://serpapi.com/search', {
        params: searchParams,
        timeout: 15000
      });

      const data = response.data;
      const results = {
        query: query,
        type: type,
        organic: [],
        answerBox: null,
        knowledgeGraph: null,
        images: null,
        news: null,
        videos: null,
        shopping: null,
        localResults: null,
        relatedSearches: null
      };

      // 1️⃣ ORGANIC RESULTS (Normal arama sonuçları)
      if (data.organic_results && data.organic_results.length > 0) {
        data.organic_results.forEach(result => {
          results.organic.push({
            position: result.position,
            title: result.title,
            snippet: result.snippet || result.description || '',
            url: result.link,
            displayLink: result.displayed_link,
            date: result.date,
            richSnippet: result.rich_snippet || null,
            sitelinks: result.sitelinks || null
          });
        });
      }

      // 2️⃣ ANSWER BOX (Hızlı yanıt kutusu)
      if (data.answer_box) {
        const box = data.answer_box;
        results.answerBox = {
          type: box.type,
          title: box.title,
          answer: box.answer || box.snippet,
          list: box.list || null,
          table: box.table || null,
          link: box.link,
          source: box.source
        };
      }

      // 3️⃣ KNOWLEDGE GRAPH (Bilgi paneli)
      results.knowledgeGraph = processKnowledgeGraph(data);

      // 4️⃣ IMAGES (Resimler)
      results.images = processImages(data);

      // 5️⃣ NEWS (Haberler)
      results.news = processNews(data);

      // 6️⃣ VIDEOS (Videolar)
      results.videos = processVideos(data);

      // 7️⃣ SHOPPING (Alışveriş)
      results.shopping = processShopping(data);

      // 8️⃣ LOCAL RESULTS (Yerel işletmeler)
      results.localResults = processLocalResults(data);

      // 9️⃣ RELATED SEARCHES (İlgili aramalar)
      results.relatedSearches = processRelatedSearches(data);

      // Hiç sonuç yoksa
      if (results.organic.length === 0 && 
          !results.answerBox && 
          !results.knowledgeGraph &&
          !results.images &&
          !results.news &&
          !results.videos) {
        return {
          success: false,
          error: 'Sonuç bulunamadı'
        };
      }

      return {
        success: true,
        data: results
      };

    } catch (error) {
      console.error('❌ SerpAPI error:', error.message);
      
      // Rate limit hatası
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'API limiti aşıldı. Lütfen birkaç saniye bekleyin.'
        };
      }

      return {
        success: false,
        error: 'Arama yapılamadı: ' + error.message
      };
    }
  }
};