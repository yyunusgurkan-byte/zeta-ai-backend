// 🧠 ZETA ORCHESTRATOR - Ana Karar Mekanizması
const ToolRegistry = require('../tools/toolRegistry');
const ContextManager = require('./contextManager');
const SafetyFilter = require('./safetyFilter');
const GroqProvider = require('../ai/groqProvider');
const { analyzePackageJson } = require('../tools/packageAnalyzer');

class ZetaOrchestrator {
  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.contextManager = new ContextManager();
    this.safetyFilter = new SafetyFilter();
    this.groqProvider = new GroqProvider();
    
    console.log('🧠 Zeta Orchestrator initialized');
  }

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

      // 3️⃣ PACKAGE.JSON KONTROLÜ
      const packageJson = this.extractPackageJson(userMessage);
      if (packageJson) {
        console.log('📦 package.json algılandı, analiz başlıyor...');
        return await this.handlePackageAnalysis(userMessage, context, packageJson);
      }

      // 4️⃣ TOOL KARARINI VER
      const toolDecision = await this.decideTools(userMessage);

      // 5️⃣ TOOL VARSA ÇALIŞTIR
      if (toolDecision.useTool) {
        console.log(`🔧 Tool selected: ${toolDecision.toolName}`);
        
        const toolResult = await this.toolRegistry.execute(
          toolDecision.toolName,
          toolDecision.params
        );

        if (toolResult.success) {
          return await this.generateResponseWithTool(
            userMessage,
            context,
            toolDecision.toolName,
            toolResult
          );
        } else {
          console.warn(`⚠️ Tool failed: ${toolResult.error}`);
          return await this.generateResponse(userMessage, context);
        }
      }

      // 6️⃣ NORMAL SOHBET
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

  extractPackageJson(userMessage) {
    const extractJson = (text, startIdx) => {
      let depth = 0;
      for (let i = startIdx; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
          depth--;
          if (depth === 0) return text.slice(startIdx, i + 1);
        }
      }
      return null;
    };

    const tryParse = (text) => {
      let idx = text.indexOf('{');
      while (idx !== -1) {
        const candidate = extractJson(text, idx);
        if (candidate) {
          try {
            const parsed = JSON.parse(candidate);
            if (parsed.dependencies || parsed.devDependencies) return parsed;
          } catch {}
        }
        idx = text.indexOf('{', idx + 1);
      }
      return null;
    };

    const codeBlock = userMessage.match(/```(?:json|javascript)?\s*([\s\S]*?)```/i);
    if (codeBlock) {
      const result = tryParse(codeBlock[1]);
      if (result) return result;
    }

    return tryParse(userMessage);
  }

  async handlePackageAnalysis(userMessage, context, packageJson) {
    try {
      const analysis = await analyzePackageJson(packageJson);

      if (!analysis.success) {
        return {
          type: 'success',
          message: `❌ package.json analiz edilemedi: ${analysis.error}`
        };
      }

      const { stats, fixedPackageJson } = analysis;

      let fixedBlock = '';
      if (stats.critical > 0 || stats.outdated > 0) {
        fixedBlock = `\n\n**✅ Düzeltilmiş package.json:**\n\`\`\`json\n${JSON.stringify(fixedPackageJson, null, 2)}\n\`\`\``;
      }

      const sonuc = stats.critical === 0 && stats.outdated === 0
        ? `✅ package.json temiz, ${stats.ok} paket sorunsuz.`
        : `⚠️ ${stats.critical} kritik hata, ${stats.outdated} eski paket bulundu.`;

      return {
        type: 'success',
        message: `${sonuc}${fixedBlock}`,
        toolUsed: 'packageAnalyzer',
        toolData: { stats, results: analysis.results }
      };

    } catch (error) {
      console.error('❌ Package analysis error:', error);
      return {
        type: 'success',
        message: `❌ Paket analizi sırasında hata: ${error.message}`
      };
    }
  }

  async decideTools(userMessage) {
    const lowerInput = userMessage.toLowerCase();

    // 🌤️ HAVA DURUMU
    const hasWeatherIntent = (
  (lowerInput.includes('hava durumu') || lowerInput.includes('weather')) ||
  (lowerInput.includes('sıcaklık') && !lowerInput.includes('öğren')) ||
  (lowerInput.includes('derece') && (lowerInput.includes('bugün') || lowerInput.includes('yarın'))) ||
  /^(istanbul|ankara|izmir|bursa|antalya)\s*(hava|weather)/i.test(lowerInput)
);

    if (hasWeatherIntent) {
      let city = 'Istanbul';
      const cityPatterns = [
      /(.+?)\s+(?:hava durumu|weather)/i,
/(?:hava durumu|weather)\s+(.+)/i,
      ];
      for (const pattern of cityPatterns) {
        const match = userMessage.match(pattern);
        if (match?.[1]) { city = match[1]; break; }
      }
      return { useTool: true, toolName: 'weather', params: { city } };
    }

    // ⚽ SPOR
    const sportsKeywords = [
      'galatasaray','fenerbahçe','beşiktaş','trabzonspor','başakşehir',
      'süper lig','puan durumu','puan tablosu','sıralama',
      'maç','gol','skor','futbol','son maç'
    ];
    if (sportsKeywords.some(k => lowerInput.includes(k))) {
      return { useTool: true, toolName: 'apiFootball', params: { query: userMessage } };
    }

    // 📚 WIKIPEDIA
    const wikiPatterns = [/nedir$/i, /kimdir$/i, /ne demek$/i, /hakkında/i];
    if (wikiPatterns.some(p => p.test(userMessage))) {
      const searchTerm = userMessage.replace(/nedir|kimdir|ne demek|hakkında|bilgi ver/gi, '').trim();
      if (searchTerm.length > 2) {
        return { useTool: true, toolName: 'wikipedia', params: { query: searchTerm } };
      }
    }

    // 🌐 WEB SEARCH
   const searchKeywords = ['ara','search','güncel','son dakika','şu an','haber','dolar','euro','döviz','kur'];
    if (searchKeywords.some(k => lowerInput.includes(k))) {
      return { useTool: true, toolName: 'webSearch', params: { query: userMessage } };
    }

// 📸 INSTAGRAM
const instagramPatterns = [
  /instagram\.com\//i,
  /instagram.*analiz/i,
  /instagram.*profil/i,
  /@[a-z0-9_.]+/i
];
if (instagramPatterns.some(p => p.test(userMessage))) {
  return { useTool: true, toolName: 'instagram', params: { query: userMessage } };
}

    // 🔢 HESAP MAKİNESİ
    if (/(\d+)\s*[\+\-\*\/x÷]\s*(\d+)/.test(userMessage)) {
      return { useTool: true, toolName: 'calculator', params: { expression: userMessage } };
    }

    return { useTool: false };
  }

  async generateResponseWithTool(userMessage, context, toolName, toolResult) {
    const toolPrompt = `
Kullanıcı sorusu: "${userMessage}"

${toolName} tool'undan gelen bilgi:
${JSON.stringify(toolResult.data || toolResult, null, 2)}

Yukarıdaki bilgiyi kullanarak kullanıcıya KISA, NET ve ANLAŞILİR bir yanıt ver.
KURALLAR:
- JSON formatını kullanıcıya gösterme
- Doğal dil ile yanıt ver
- Maksimum 3-4 cümle
- Bilgiyi özetle, aynen kopyalama
`;
    const response = await this.groqProvider.chat(context, toolPrompt);
    return { type: 'success', message: response, toolUsed: toolName, toolData: toolResult.data };
  }

  async generateResponse(userMessage, context) {
    const response = await this.groqProvider.chat(context, userMessage);
    return { type: 'success', message: response };
  }

  listTools() {
    return this.toolRegistry.list();
  }
}

module.exports = ZetaOrchestrator;