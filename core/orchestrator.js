// 🧠 ZETA ORCHESTRATOR - AI-Powered Tool Selection (Claude-like)
// GROQ ile akıllı tool seçimi

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
   * Ana işlem fonksiyonu
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

      // 3️⃣ AI İLE TOOL KARARINI VER
      const toolDecision = await this.decideToolsWithAI(userMessage);

      // 4️⃣ TOOL VARSA ÇALIŞTIR
      if (toolDecision.useTool) {
        console.log(`🔧 Tool selected by AI: ${toolDecision.toolName}`);
        
        const toolResult = await this.toolRegistry.execute(
          toolDecision.toolName,
          toolDecision.params || { query: userMessage }
        );

        if (!toolResult.success) {
          console.log(`⚠️ Tool failed: ${toolResult.error}`);
        }

        // 5️⃣ GROQ İLE YANIT OLUŞTUR (Tool sonucuyla)
        const finalResponse = await this.generateResponse(
          userMessage,
          context,
          toolResult
        );

        return {
          type: 'success',
          message: finalResponse,
          toolData: toolResult.data || null,
          toolUsed: toolDecision.toolName
        };
      }

      // Tool yok - Sadece sohbet
      const response = await this.generateResponse(userMessage, context, null);
      
      return {
        type: 'success',
        message: response,
        toolData: null
      };

    } catch (error) {
      console.error('❌ Orchestration error:', error);
      return {
        type: 'error',
        message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
      };
    }
  }

  /**
   * 🤖 AI-POWERED TOOL SELECTION (Claude gibi)
   * GROQ ile akıllı tool seçimi
   */
  async decideToolsWithAI(userMessage) {
    try {
      const systemPrompt = `Sen bir tool selector asistanısın. Kullanıcının isteğine göre EN UYGUN tool'u seç.

MEVCUT TOOLS:
1. webSearch - Genel arama, güncel bilgi, haberler, fiyatlar (Google arama)
2. wikipedia - Ansiklopedik bilgi, kişiler, kavramlar, tanımlar
3. weather - Hava durumu sorguları
4. apiFootball - Futbol maçları, puan durumu, takımlar, golcüler
5. calculator - Matematik hesaplamaları

KURALLLAR:
- "maç" kelimesi SADECE futbol bağlamında ise apiFootball kullan
- "Maçka", "maçkolik" gibi kelimeler futbol DEĞİL
- Güncel bilgi, fiyat, haber → webSearch
- Kişi/kavram tanımı → wikipedia
- Sıcaklık, hava → weather
- Hesaplama → calculator
- Emin değilsen → none

Sadece tool adını döndür: webSearch, wikipedia, weather, apiFootball, calculator, veya none`;

      const response = await this.groqProvider.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1, // Düşük temperature = tutarlı kararlar
        max_tokens: 20
      });

      const toolName = response.choices[0].message.content.trim().toLowerCase();
      
      console.log(`🤖 AI Tool Decision: "${toolName}" for "${userMessage.substring(0, 50)}..."`);

      // Geçerli tool mı kontrol et
      const validTools = ['websearch', 'wikipedia', 'weather', 'apifootball', 'calculator'];
      
      if (validTools.includes(toolName)) {
        return {
          useTool: true,
          toolName: toolName,
          params: { query: userMessage }
        };
      }

      return { useTool: false };

    } catch (error) {
      console.error('❌ AI Tool Selection failed, falling back to keywords:', error.message);
      // Fallback: Keyword-based (eski sistem)
      return await this.decideToolsKeywordFallback(userMessage);
    }
  }

  /**
   * 🔧 Fallback: Keyword-based tool selection
   * AI başarısız olursa bu çalışır
   */
  async decideToolsKeywordFallback(userMessage) {
    const lowerInput = userMessage.toLowerCase().trim();

    // HAVA DURUMU (en üstte - öncelikli)
    const weatherKeywords = ['hava', 'sıcaklık', 'derece', 'yağmur', 'güneş'];
    if (weatherKeywords.some(k => lowerInput.includes(k))) {
      let city = 'istanbul';
      const cityPatterns = [
        /([a-zçğıöşü]+)\s+hava/i,
        /hava\s+([a-zçğıöşü]+)/i,
        /([a-zçğıöşü]+)\s+sıcaklık/i
      ];
      
      for (const pattern of cityPatterns) {
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          city = match[1];
          break;
        }
      }
      
      return {
        useTool: true,
        toolName: 'weather',
        params: { city }
      };
    }

    // FUTBOL
    const sportsKeywords = [
      'galatasaray', 'fenerbahçe', 'beşiktaş', 'trabzonspor',
      'süper lig', 'puan durumu', 'tablo', 'golcü', 'canlı maç'
    ];

    if (sportsKeywords.some(k => lowerInput.includes(k))) {
      return {
        useTool: true,
        toolName: 'apiFootball',
        params: { query: userMessage }
      };
    }

    // WIKIPEDIA
    const wikiPatterns = [/nedir$/i, /kimdir$/i, /hakkında/i];
    if (wikiPatterns.some(p => p.test(userMessage))) {
      return {
        useTool: true,
        toolName: 'wikipedia',
        params: { query: userMessage.replace(/nedir|kimdir|hakkında/gi, '').trim() }
      };
    }

    // WEB SEARCH
    const searchKeywords = ['ara', 'bul', 'güncel', 'haber'];
    if (searchKeywords.some(k => lowerInput.includes(k))) {
      return {
        useTool: true,
        toolName: 'webSearch',
        params: { query: userMessage }
      };
    }

    // CALCULATOR
    if (/(\d+)\s*[\+\-\*\/]\s*(\d+)/.test(userMessage)) {
      return {
        useTool: true,
        toolName: 'calculator',
        params: { expression: userMessage }
      };
    }

    return { useTool: false };
  }

  /**
   * GROQ ile final response oluştur
   */
  async generateResponse(userMessage, context, toolResult) {
    const systemPrompt = `Sen Zeta AI adında yardımcı bir asistansın. Türkçe konuşursun.
${toolResult ? `
Kullanıcıya tool sonucunu doğal bir dille açıkla. Tool verilerini direkt gösterme, onları yorumla ve anlaşılır hale getir.

Tool Sonucu:
${JSON.stringify(toolResult.data, null, 2)}
` : ''}

KURALLAR:
- Kısa ve öz yaz
- Doğal konuş
- Tool verilerini yorum
yaparak aktar
- Gereksiz detay verme`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...context.messages,
      { role: "user", content: userMessage }
    ];

    const response = await this.groqProvider.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  }
}

module.exports = ZetaOrchestrator;