// 🧠 ZETA ORCHESTRATOR - Ana Karar Mekanizması
// Claude'un orchestration layer'ına benzer yapı

const ToolRegistry = require('../tools/toolRegistry');
const ContextManager = require('./contextManager');
const SafetyFilter = require('./safetyFilter');
const GroqProvider = require('../ai/groqProvider');

class ZetaOrchestrator {
  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.contextManager = new ContextManager();
    this.safetyFilter = new SafetyFilter();
    this.groqProvider = new GroqProvider();
    
    console.log('🧠 Zeta Orchestrator initialized');
  }

  /**
   * Ana işlem fonksiyonu - Claude'daki process() metoduna benzer
   * @param {string} userMessage - Kullanıcı mesajı
   * @param {Array} conversationHistory - Konuşma geçmişi
   * @returns {Object} - İşlenmiş yanıt
   */
  async process(userMessage, conversationHistory = []) {
    console.log(`🔄 Processing: "${userMessage.substring(0, 50)}..."`);

    try {
      // 1️⃣ GÜVENLİK KONTROLÜ
      const safetyCheck = this.safetyFilter.check(userMessage);
      if (!safetyCheck.safe) {
        return {
          type: 'safety_block',
          message: safetyCheck.message,
          reason: safetyCheck.reason
        };
      }

      // 2️⃣ CONTEXT HAZIRLA
      const context = this.contextManager.prepare(conversationHistory);

      // 3️⃣ TOOL KARARINI VER
      const toolDecision = await this.decideTools(userMessage);

      // 4️⃣ TOOL VARSA ÇALIŞTIR
      if (toolDecision.useTool) {
        console.log(`🔧 Tool selected: ${toolDecision.toolName}`);
        
        const toolResult = await this.toolRegistry.execute(
          toolDecision.toolName,
          toolDecision.params
        );

        // Tool başarılıysa AI'ya gönder
        if (toolResult.success) {
          return await this.generateResponseWithTool(
            userMessage,
            context,
            toolDecision.toolName,
            toolResult
          );
        } else {
          // Tool başarısız, normal sohbete dön
          console.warn(`⚠️ Tool failed: ${toolResult.error}`);
          return await this.generateResponse(userMessage, context);
        }
      }

      // 5️⃣ NORMAL SOHBET
      return await this.generateResponse(userMessage, context);

    } catch (error) {
      console.error('❌ Orchestrator error:', error);
      return {
        type: 'error',
        message: '❌ Bir hata oluştu. Lütfen tekrar deneyin.',
        error: error.message
      };
    }
  }

  /**
   * Tool kararı ver - Hangi tool kullanılacak?
   */
  async decideTools(userMessage) {
    const lowerInput = userMessage.toLowerCase();

    // ⚽ SPOR SORGUSU
    const sportsKeywords = [
      'galatasaray', 'fenerbahçe', 'beşiktaş', 'trabzonspor',
      'süper lig', 'puan durumu', 'puan tablosu', 'sıralama',
      'maç', 'gol', 'skor', 'futbol'
    ];

    if (sportsKeywords.some(k => lowerInput.includes(k))) {
      return {
        useTool: true,
        toolName: 'tffSports',
        params: { query: userMessage }
      };
    }

    // 🌤️ HAVA DURUMU
    const weatherKeywords = ['hava durumu', 'sıcaklık', 'weather', 'derece'];
    
    if (weatherKeywords.some(k => lowerInput.includes(k))) {
      // Şehir adını çıkar
      const cityMatch = userMessage.match(/(?:hava durumu|weather)\s+(\w+)/i);
      const city = cityMatch ? cityMatch[1] : 'Istanbul';
      
      return {
        useTool: true,
        toolName: 'weather',
        params: { city }
      };
    }

    // 📚 WIKIPEDIA
    const wikiPatterns = [
      /nedir$/i,
      /kimdir$/i,
      /ne demek$/i,
      /hakkında/i
    ];

    if (wikiPatterns.some(p => p.test(userMessage))) {
      const searchTerm = userMessage
        .replace(/nedir|kimdir|ne demek|hakkında|bilgi ver/gi, '')
        .trim();

      if (searchTerm.length > 2) {
        return {
          useTool: true,
          toolName: 'wikipedia',
          params: { query: searchTerm }
        };
      }
    }

    // 🌐 GOOGLE SEARCH
    const searchKeywords = [
      'ara', 'bul', 'search', 'güncel', 'son dakika',
      'bugün', 'şu an', 'haber'
    ];

    if (searchKeywords.some(k => lowerInput.includes(k))) {
      return {
        useTool: true,
        toolName: 'webSearch',
        params: { query: userMessage }
      };
    }

    // 🔢 HESAP MAKINESI
    const mathPattern = /(\d+)\s*[\+\-\*\/x÷]\s*(\d+)/;
    
    if (mathPattern.test(userMessage)) {
      return {
        useTool: true,
        toolName: 'calculator',
        params: { expression: userMessage }
      };
    }

    // ❌ TOOL GEREKMİYOR
    return { useTool: false };
  }

  /**
   * Tool sonucuyla yanıt üret
   */
  async generateResponseWithTool(userMessage, context, toolName, toolResult) {
    // Tool sonucunu AI prompt'una ekle
    const toolPrompt = `
Kullanıcı sorusu: "${userMessage}"

${toolName} tool'undan gelen bilgi:
${JSON.stringify(toolResult.data || toolResult, null, 2)}

Yukarıdaki bilgiyi kullanarak kullanıcıya KISA, NET ve ANLAŞILIR bir yanıt ver.
KURALLLAR:
- JSON formatını kullanıcıya gösterme
- Doğal dil ile yanıt ver
- Maksimum 3-4 cümle
- Bilgiyi özetle, aynen kopyalama
`;

    const response = await this.groqProvider.chat(context, toolPrompt);

    return {
      type: 'success',
      message: response,
      toolUsed: toolName,
      toolData: toolResult.data
    };
  }

  /**
   * Normal yanıt üret (tool olmadan)
   */
  async generateResponse(userMessage, context) {
    const response = await this.groqProvider.chat(context, userMessage);

    return {
      type: 'success',
      message: response
    };
  }

  /**
   * Mevcut toolları listele
   */
  listTools() {
    return this.toolRegistry.list();
  }
}

module.exports = ZetaOrchestrator;
