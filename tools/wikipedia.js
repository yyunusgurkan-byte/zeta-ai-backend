// 📚 WIKIPEDIA TOOL - ENHANCED VERSION (FIXED)
// Türkçe ve İngilizce Wikipedia'dan detaylı bilgi ve resimler çeker

const axios = require('axios');

/**
 * Sayfa resimlerini getir
 */
async function getImages(query, lang, summary) {
  try {
    const images = [];

    // Ana resim (yüksek kalite)
    if (summary.originalimage?.source) {
      images.push({
        type: 'main',
        url: summary.originalimage.source,
        width: summary.originalimage.width,
        height: summary.originalimage.height,
        thumbnail: summary.thumbnail?.source
      });
    } else if (summary.thumbnail?.source) {
      images.push({
        type: 'main',
        url: summary.thumbnail.source,
        width: summary.thumbnail.width,
        height: summary.thumbnail.height
      });
    }

    // Ek resimler için MediaWiki API kullan
    try {
      const mediaUrl = `https://${lang}.wikipedia.org/w/api.php`;
      const mediaResponse = await axios.get(mediaUrl, {
        params: {
          action: 'query',
          titles: query,
          prop: 'images|pageimages',
          pithumbsize: 500,
          format: 'json',
          origin: '*'
        },
        timeout: 5000
      });

      const pages = mediaResponse.data.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0];
        
        // Sayfa görseli
        if (page.thumbnail?.source && !images.some(img => img.url === page.thumbnail.source)) {
          images.push({
            type: 'page',
            url: page.thumbnail.source,
            width: page.thumbnail.width,
            height: page.thumbnail.height
          });
        }

        // Sayfadaki diğer resimler
        if (page.images && images.length < 5) {
          for (let i = 0; i < Math.min(3, page.images.length); i++) {
            const img = page.images[i];
            if (img.title && !img.title.includes('.svg')) {
              images.push({
                type: 'additional',
                title: img.title
              });
            }
          }
        }
      }
    } catch (mediaError) {
      console.log('⚠️ Ek resimler alınamadı:', mediaError.message);
    }

    return images.length > 0 ? images : null;

  } catch (error) {
    console.error('❌ Image fetch error:', error.message);
    return null;
  }
}

/**
 * Tam sayfa içeriğini getir
 */
async function getFullContent(query, lang) {
  try {
    const contentUrl = `https://${lang}.wikipedia.org/w/api.php`;
    
    const response = await axios.get(contentUrl, {
      params: {
        action: 'query',
        titles: query,
        prop: 'extracts',
        exintro: false,
        explaintext: true,
        format: 'json',
        origin: '*'
      },
      timeout: 8000
    });

    const pages = response.data.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0];
      return page.extract || null;
    }

    return null;

  } catch (error) {
    console.error('❌ Full content error:', error.message);
    return null;
  }
}

/**
 * İlgili sayfaları getir
 */
async function getRelatedPages(query, lang) {
  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php`;
    
    const response = await axios.get(searchUrl, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: 5,
        format: 'json',
        origin: '*'
      },
      timeout: 5000
    });

    const results = response.data.query?.search;
    if (results && results.length > 1) {
      return results.slice(1, 4).map(result => ({
        title: result.title,
        snippet: result.snippet?.replace(/<[^>]*>/g, ''),
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`
      }));
    }

    return null;

  } catch (error) {
    console.error('❌ Related pages error:', error.message);
    return null;
  }
}

module.exports = {
  name: 'wikipedia',
  description: 'Wikipedia\'dan detaylı bilgi ve resimler getirir',

  /**
   * Wikipedia araması yap
   * @param {Object} params - { query: string, lang: 'tr'|'en', includeImages: boolean, fullContent: boolean }
   */
  async execute({ query, lang = 'tr', includeImages = true, fullContent = false }) {
    try {
      console.log(`📚 Wikipedia searching: "${query}" (${lang.toUpperCase()})`);

      // Query'yi temizle
      const cleanQuery = query
        .replace(/nedir|kimdir|ne demek|hakkında|bilgi ver|ne dir|kim dir/gi, '')
        .replace(/what is|who is|about|information/gi, '')
        .replace(/[?!.,]/g, '')
        .trim();

      if (cleanQuery.length < 2) {
        return {
          success: false,
          error: 'Arama terimi çok kısa'
        };
      }

      // 1️⃣ Ana sayfa bilgisi al
      const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
      
      const summaryResponse = await axios.get(summaryUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'ZetaAI/2.0'
        }
      });

      const summary = summaryResponse.data;

      // Sonuç objesi
      const result = {
        success: true,
        data: {
          title: summary.title,
          extract: summary.extract,
          description: summary.description || null,
          url: summary.content_urls?.desktop?.page,
          lang: lang,
          coordinates: summary.coordinates || null,
          timestamp: summary.timestamp || null
        }
      };

      // 2️⃣ Resimler iste
      if (includeImages) {
        const images = await getImages(cleanQuery, lang, summary);
        result.data.images = images;
      }

      // 3️⃣ Tam içerik iste (opsiyonel)
      if (fullContent) {
        const content = await getFullContent(cleanQuery, lang);
        result.data.fullContent = content;
      }

      // 4️⃣ İlgili sayfalar
      const related = await getRelatedPages(cleanQuery, lang);
      result.data.relatedPages = related;

      return result;

    } catch (error) {
      console.error('❌ Wikipedia error:', error.message);

      // 404 - Sayfa bulunamadı
      if (error.response?.status === 404) {
        return {
          success: false,
          error: `"${query}" için Wikipedia sayfası bulunamadı.`,
          suggestion: lang === 'tr' ? 'İngilizce aramayı deneyin (lang: "en")' : null
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