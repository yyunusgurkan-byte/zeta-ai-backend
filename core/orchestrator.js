// 🧠 ZETA ORCHESTRATOR - Ana Karar Mekanizması
const ToolRegistry = require('../tools/toolRegistry');
const ContextManager = require('./contextManager');
const SafetyFilter = require('./safetyFilter');
const GroqProvider = require('../ai/groqProvider');
const { analyzePackageJson } = require('../tools/packageAnalyzer');
const { getNobetciEczaneler } = require('../tools/eczane');

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
      const safetyCheck = this.safetyFilter.check(userMessage);
      if (!safetyCheck.safe) {
        return { type: 'safety_block', message: safetyCheck.message, reason: safetyCheck.reason };
      }

      const context = this.contextManager.prepare(conversationHistory);

      const packageJson = this.extractPackageJson(userMessage);
      if (packageJson) {
        return await this.handlePackageAnalysis(userMessage, context, packageJson);
      }

      const eczaneCheck = this.extractEczaneSehir(userMessage);
      if (eczaneCheck) {
        return await this.handleEczane(eczaneCheck);
      }

      const toolDecision = await this.decideTools(userMessage);

      if (toolDecision.useTool) {
        const toolResult = await this.toolRegistry.execute(toolDecision.toolName, toolDecision.params);
        if (toolResult.success) {
          return await this.generateResponseWithTool(userMessage, context, toolDecision.toolName, toolResult);
        }
      }

      return await this.generateResponse(userMessage, context);

    } catch (error) {
      console.error('❌ Orchestrator error:', error);
      return { type: 'error', message: '❌ Bir hata oluştu. Lütfen tekrar deneyin.', error: error.message };
    }
  }

  async decideTools(userMessage) {
    // 🔢 Hesap makinesi
    if (/(\d+)\s*[\+\-\*\/x÷]\s*(\d+)/.test(userMessage)) {
      return { useTool: true, toolName: 'calculator', params: { expression: userMessage } };
    }

    // 📸 Instagram
    if (/instagram\.com\//i.test(userMessage) || /instagram.*analiz/i.test(userMessage)) {
      return { useTool: true, toolName: 'instagram', params: { query: userMessage } };
    }

    // 🤖 Groq'a sor
    const toolPrompt = `Sen bir asistan yönlendiricisin. Kullanıcının mesajına bakarak hangi tool'u kullanmam gerektiğini söyle.

Kullanıcı mesajı: "${userMessage}"

Sadece aşağıdaki seçeneklerden BİRİNİ döndür (başka hiçbir şey yazma):
- "weather" → hava durumu, sıcaklık, yağış tahmini soruluyorsa
- "apiFootball" → puan durumu, gol krallığı, lig sıralaması soruluyorsa
- "webSearch" → güncel haber, son dakika, güncel bilgi soruluyorsa
- "wikipedia" → bir konu hakkında genel bilgi, tarih, tanım soruluyorsa
- "none" → sohbet, fikir, yorum, tahmin, öneri, şiir, hikaye, genel sorular

Örnekler:
"istanbul hava nasıl" → weather
"galatasaray kaçıncı sırada" → apiFootball
"bugün dolar kaç" → webSearch
"einstein kimdir" → wikipedia
"bu akşam gs liverpool maçı var senin tahminin ne" → none
"iddaa tahmini ver" → none
"sen nasılsın" → none
"son dakika haberleri" → webSearch
"ankara yarın yağmur var mı" → weather

Sadece tek kelime yaz:`;

    try {
      const decision = await this.groqProvider.chat([], toolPrompt);
      const raw = decision.trim().toLowerCase().replace(/[^a-z]/g, '');

      let tool = 'none';
      if (raw.startsWith('weather')) tool = 'weather';
      else if (raw.startsWith('apifootball')) tool = 'apifootball';
      else if (raw.startsWith('websearch')) tool = 'websearch';
      else if (raw.startsWith('wikipedia')) tool = 'wikipedia';

      console.log(`🤖 LLM raw: "${raw}" → tool: "${tool}"`);

      if (tool === 'weather') {
        let city = 'Istanbul';
        const cityPatterns = [
          /(.+?)\s+(?:hava durumu|hava|weather)/i,
          /(?:hava durumu|hava|weather)\s+(.+)/i,
        ];
        for (const pattern of cityPatterns) {
          const match = userMessage.match(pattern);
          if (match?.[1]?.trim().length > 1) { city = match[1].trim(); break; }
        }
        return { useTool: true, toolName: 'weather', params: { city } };
      }

      if (tool === 'apifootball') {
        return { useTool: true, toolName: 'apiFootball', params: { query: userMessage } };
      }

      if (tool === 'websearch') {
        return { useTool: true, toolName: 'webSearch', params: { query: userMessage } };
      }

      if (tool === 'wikipedia') {
        const searchTerm = userMessage.replace(/nedir|kimdir|ne demek|hakkında|bilgi ver/gi, '').trim();
        return { useTool: true, toolName: 'wikipedia', params: { query: searchTerm } };
      }

      return { useTool: false };

    } catch (e) {
      console.warn('⚠️ LLM tool kararı alınamadı:', e.message);
      return { useTool: false };
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
        return { type: 'success', message: `❌ package.json analiz edilemedi: ${analysis.error}` };
      }
      const { stats, fixedPackageJson } = analysis;
      let fixedBlock = '';
      if (stats.critical > 0 || stats.outdated > 0) {
        fixedBlock = `\n\n**✅ Düzeltilmiş package.json:**\n\`\`\`json\n${JSON.stringify(fixedPackageJson, null, 2)}\n\`\`\``;
      }
      const sonuc = stats.critical === 0 && stats.outdated === 0
        ? `✅ package.json temiz, ${stats.ok} paket sorunsuz.`
        : `⚠️ ${stats.critical} kritik hata, ${stats.outdated} eski paket bulundu.`;
      return { type: 'success', message: `${sonuc}${fixedBlock}`, toolUsed: 'packageAnalyzer', toolData: { stats, results: analysis.results } };
    } catch (error) {
      return { type: 'success', message: `❌ Paket analizi sırasında hata: ${error.message}` };
    }
  }

  async generateResponseWithTool(userMessage, context, toolName, toolResult) {
    const toolPrompt = `
Kullanıcı sorusu: "${userMessage}"

${toolName} tool'undan gelen bilgi:
${JSON.stringify(toolResult.data || toolResult, null, 2)}

Kullanıcıya KISA, NET ve ANLAŞILİR bir yanıt ver. JSON gösterme, doğal dil kullan, max 3-4 cümle.`;
    const response = await this.groqProvider.chat(context, toolPrompt);
    return { type: 'success', message: response, toolUsed: toolName, toolData: toolResult.data };
  }

  async generateResponse(userMessage, context) {
    const response = await this.groqProvider.chat(context, userMessage);
    return { type: 'success', message: response };
  }

  extractEczaneSehir(userMessage) {
    const msg = userMessage.toLowerCase();
    const eczaneKeywords = ['nöbetçi eczane', 'nobetci eczane', 'eczane nöbet', 'açık eczane', 'acik eczane', 'nöbetçi eczaneler', 'eczane bul'];
    if (!eczaneKeywords.some(k => msg.includes(k))) return null;
    const sehirler = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya', 'gaziantep', 'mersin', 'kayseri', 'eskişehir', 'eskisehir', 'diyarbakır', 'diyarbakir', 'samsun', 'trabzon', 'malatya', 'sakarya', 'denizli', 'manisa', 'balıkesir', 'balikesir', 'van', 'erzurum', 'kahramanmaraş', 'kahramanmaras'];
    for (const s of sehirler) {
      if (msg.includes(s)) return s;
    }
    return 'istanbul';
  }

  async handleEczane(sehir) {
    try {
      const data = await getNobetciEczaneler(sehir);
      if (!data.success) {
        return { type: 'success', message: `❌ ${sehir} için nöbetçi eczane bilgisi alınamadı.` };
      }
      return { type: 'success', message: `💊 **${data.sehir}** için bugün **${data.toplam}** nöbetçi eczane bulundu.`, toolUsed: 'eczane', toolData: { type: 'eczane', ...data } };
    } catch (err) {
      return { type: 'success', message: `❌ Nöbetçi eczane bilgisi alınamadı: ${err.message}` };
    }
  }

  listTools() {
    return this.toolRegistry.list();
  }
}

module.exports = ZetaOrchestrator;