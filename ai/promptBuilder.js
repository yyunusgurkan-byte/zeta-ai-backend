// backend/ai/promptBuilder.js

const { SYSTEM_PROMPTS } = require('../config/constants');
const fs = require('fs').promises;
const path = require('path');

class PromptBuilder {
  constructor() {
    this.baseSystemPrompt = SYSTEM_PROMPTS.BASE;
  }

  /**
   * Sistem promptunu oluşturur
   * @param {Object} context - Konuşma bağlamı
   * @param {Array} activeSkills - Aktif skill'ler
   */
  async buildSystemPrompt(context = {}, activeSkills = []) {
    let systemPrompt = this.baseSystemPrompt;

    // Tarih ve saat bilgisi ekle
    const now = new Date();
    const dateInfo = `\n\nCurrent date and time: ${now.toLocaleString('tr-TR', { 
      timeZone: 'Europe/Istanbul',
      dateStyle: 'full',
      timeStyle: 'short'
    })}`;
    
    systemPrompt += dateInfo;

    // Kullanıcı bilgileri varsa ekle
    if (context.user) {
      systemPrompt += `\n\nUser Information:`;
      if (context.user.name) systemPrompt += `\n- Name: ${context.user.name}`;
      if (context.user.location) systemPrompt += `\n- Location: ${context.user.location}`;
      if (context.user.preferences) {
        systemPrompt += `\n- Preferences: ${JSON.stringify(context.user.preferences)}`;
      }
    }

    // Aktif skill'leri ekle
    if (activeSkills.length > 0) {
      systemPrompt += '\n\n## Active Skills:\n';
      
      for (const skill of activeSkills) {
        try {
          const skillContent = await this.loadSkillContent(skill);
          systemPrompt += `\n### ${skill.name}\n${skillContent}\n`;
        } catch (error) {
          console.error(`Failed to load skill ${skill.name}:`, error);
        }
      }
    }

    // Özel talimatlar varsa ekle
    if (context.instructions) {
      systemPrompt += `\n\n## Special Instructions:\n${context.instructions}`;
    }

    return systemPrompt;
  }

  /**
   * Skill dosyasını yükler
   */
  async loadSkillContent(skill) {
    const skillPath = path.join(__dirname, '../../skills', skill.category, skill.name, 'SKILL.md');
    try {
      const content = await fs.readFile(skillPath, 'utf-8');
      return content;
    } catch (error) {
      console.warn(`Skill file not found: ${skillPath}`);
      return `Skill: ${skill.name} (content not available)`;
    }
  }

  /**
   * Mesaj geçmişini formatlar
   * @param {Array} history - Konuşma geçmişi
   * @param {Number} maxMessages - Maksimum mesaj sayısı
   */
  formatMessageHistory(history, maxMessages = 20) {
    if (!history || history.length === 0) return [];

    // Son N mesajı al
    const recentHistory = history.slice(-maxMessages);

    return recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id })
    }));
  }

  /**
   * Tool sonuçlarını mesaj formatına çevirir
   */
  formatToolResults(toolCalls, results) {
    return results.map((result, index) => ({
      role: 'tool',
      tool_call_id: toolCalls[index].id,
      name: toolCalls[index].function.name,
      content: JSON.stringify(result)
    }));
  }

  /**
   * Tam mesaj dizisini oluşturur
   */
  async buildMessages(userMessage, history = [], context = {}, activeSkills = []) {
    const messages = [];

    // System prompt
    const systemPrompt = await this.buildSystemPrompt(context, activeSkills);
    messages.push({
      role: 'system',
      content: systemPrompt
    });

    // Konuşma geçmişi
    const formattedHistory = this.formatMessageHistory(history);
    messages.push(...formattedHistory);

    // Yeni kullanıcı mesajı
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Token tahmini (yaklaşık)
   */
  estimateTokens(text) {
    // Basit tahmin: ortalama 1 token = 4 karakter
    return Math.ceil(text.length / 4);
  }

  /**
   * Context window kontrolü
   */
  checkContextWindow(messages, maxTokens = 8000) {
    const totalText = messages.map(m => m.content).join(' ');
    const estimatedTokens = this.estimateTokens(totalText);
    
    return {
      estimated: estimatedTokens,
      max: maxTokens,
      withinLimit: estimatedTokens < maxTokens,
      usage: Math.round((estimatedTokens / maxTokens) * 100)
    };
  }
}

module.exports = new PromptBuilder();