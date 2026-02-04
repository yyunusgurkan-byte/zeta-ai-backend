// backend/skills/skillManager.js

const skillLoader = require('./skillLoader');

class SkillManager {
  constructor() {
    this.activeSkills = new Set();
    this.skillUsageStats = new Map();
  }

  /**
   * Başlangıçta skill'leri yükle
   */
  async initialize() {
    console.log('🎯 Initializing Skill Manager...');
    await skillLoader.loadAllSkills();
    console.log('✅ Skill Manager ready');
  }

  /**
   * Kullanıcı mesajına göre uygun skill'leri belirler
   */
  async determineSkills(userMessage, context = {}) {
    const matches = skillLoader.findSkillsByTrigger(userMessage);
    
    // Yüksek güvenli eşleşmeleri al (>= 0.5)
    const relevantSkills = matches
      .filter(m => m.confidence >= 0.5)
      .map(m => m.skill);

    // Context'e göre ek skill'ler eklenebilir
    if (context.forceSkills) {
      for (const skillName of context.forceSkills) {
        const skill = skillLoader.findSkillByName(skillName);
        if (skill && !relevantSkills.includes(skill)) {
          relevantSkills.push(skill);
        }
      }
    }

    return relevantSkills;
  }

  /**
   * Skill'leri aktif hale getirir
   */
  activateSkills(skills) {
    this.activeSkills.clear();
    skills.forEach(skill => {
      this.activeSkills.add(skill.id);
      this.trackUsage(skill.id);
    });
  }

  /**
   * Aktif skill'leri döndürür
   */
  getActiveSkills() {
    const skills = [];
    for (const skillId of this.activeSkills) {
      const skill = skillLoader.getSkill(skillId);
      if (skill) skills.push(skill);
    }
    return skills;
  }

  /**
   * Skill kullanım istatistiklerini takip eder
   */
  trackUsage(skillId) {
    const current = this.skillUsageStats.get(skillId) || {
      count: 0,
      lastUsed: null,
      firstUsed: null
    };

    current.count++;
    current.lastUsed = new Date();
    if (!current.firstUsed) {
      current.firstUsed = new Date();
    }

    this.skillUsageStats.set(skillId, current);
  }

  /**
   * Skill istatistiklerini döndürür
   */
  getUsageStats(skillId = null) {
    if (skillId) {
      return this.skillUsageStats.get(skillId) || null;
    }
    
    // Tüm istatistikler
    const stats = {};
    for (const [id, data] of this.skillUsageStats.entries()) {
      const skill = skillLoader.getSkill(id);
      stats[id] = {
        ...data,
        name: skill?.name || 'Unknown'
      };
    }
    return stats;
  }

  /**
   * En çok kullanılan skill'leri döndürür
   */
  getTopSkills(limit = 10) {
    const sorted = Array.from(this.skillUsageStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit);

    return sorted.map(([id, stats]) => {
      const skill = skillLoader.getSkill(id);
      return {
        id,
        name: skill?.name || 'Unknown',
        ...stats
      };
    });
  }

  /**
   * Skill öneri sistemi
   */
  suggestSkills(userMessage, conversationHistory = []) {
    // Trigger'a göre eşleşenler
    const triggerMatches = skillLoader.findSkillsByTrigger(userMessage);
    
    // Geçmiş konuşmalarda kullanılan skill'ler
    const historicalSkills = this.analyzeHistoricalSkills(conversationHistory);
    
    // Kombine et ve skorla
    const suggestions = new Map();
    
    triggerMatches.forEach(match => {
      suggestions.set(match.skill.id, {
        skill: match.skill,
        score: match.confidence * 0.7, // Trigger ağırlığı
        reason: 'trigger_match'
      });
    });

    historicalSkills.forEach(([skillId, frequency]) => {
      const existing = suggestions.get(skillId);
      const skill = skillLoader.getSkill(skillId);
      
      if (existing) {
        existing.score += frequency * 0.3; // Geçmiş ağırlığı
      } else if (skill) {
        suggestions.set(skillId, {
          skill: skill,
          score: frequency * 0.3,
          reason: 'historical_usage'
        });
      }
    });

    // Skorlara göre sırala
    return Array.from(suggestions.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5
  }

  /**
   * Konuşma geçmişinden skill kullanımını analiz eder
   */
  analyzeHistoricalSkills(history) {
    const skillFrequency = new Map();
    
    history.forEach(msg => {
      if (msg.skills) {
        msg.skills.forEach(skillId => {
          skillFrequency.set(skillId, (skillFrequency.get(skillId) || 0) + 1);
        });
      }
    });

    // Normalize et (0-1 arası)
    const maxFreq = Math.max(...skillFrequency.values(), 1);
    for (const [id, freq] of skillFrequency.entries()) {
      skillFrequency.set(id, freq / maxFreq);
    }

    return Array.from(skillFrequency.entries())
      .sort((a, b) => b[1] - a[1]);
  }

  /**
   * Skill'i ID ile al
   */
  getSkill(skillId) {
    return skillLoader.getSkill(skillId);
  }

  /**
   * Tüm skill'leri listele
   */
  listAllSkills() {
    return skillLoader.listSkills();
  }

  /**
   * Kategoriye göre skill'leri listele
   */
  listSkillsByCategory(category) {
    return skillLoader.getSkillsByCategory(category);
  }

  /**
   * Skill'i aktif/pasif yap
   */
  toggleSkill(skillId, enabled) {
    return skillLoader.toggleSkill(skillId, enabled);
  }

  /**
   * Skill'leri yeniden yükle
   */
  async reloadSkills() {
    console.log('🔄 Reloading skills...');
    await skillLoader.reloadAllSkills();
    this.activeSkills.clear();
    console.log('✅ Skills reloaded');
  }

  /**
   * Genel istatistikler
   */
  getOverallStats() {
    return {
      loader: skillLoader.getStats(),
      usage: {
        totalUsages: Array.from(this.skillUsageStats.values())
          .reduce((sum, stat) => sum + stat.count, 0),
        uniqueSkillsUsed: this.skillUsageStats.size,
        topSkills: this.getTopSkills(5)
      },
      active: this.activeSkills.size
    };
  }

  /**
   * Skill'leri temizle
   */
  clearActiveSkills() {
    this.activeSkills.clear();
  }

  /**
   * Skill validasyonu
   */
  validateSkill(skillId) {
    const skill = skillLoader.getSkill(skillId);
    
    if (!skill) {
      return { valid: false, error: 'Skill not found' };
    }

    if (!skill.enabled) {
      return { valid: false, error: 'Skill is disabled' };
    }

    if (!skill.content) {
      return { valid: false, error: 'Skill has no content' };
    }

    return { valid: true, skill };
  }
}

module.exports = new SkillManager();