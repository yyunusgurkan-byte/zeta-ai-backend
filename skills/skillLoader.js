// backend/skills/skillLoader.js

const fs = require('fs').promises;
const path = require('path');

class SkillLoader {
  constructor() {
    this.skillsPath = path.join(__dirname, '../../skills');
    this.loadedSkills = new Map();
    this.skillCategories = ['public', 'user', 'examples'];
  }

  /**
   * Tüm skill'leri yükler
   */
  async loadAllSkills() {
    console.log('🔄 Loading skills...');
    
    for (const category of this.skillCategories) {
      try {
        await this.loadSkillsByCategory(category);
      } catch (error) {
        console.warn(`⚠️ Could not load ${category} skills:`, error.message);
      }
    }

    console.log(`✅ Loaded ${this.loadedSkills.size} skills`);
    return this.loadedSkills;
  }

  /**
   * Kategoriye göre skill'leri yükler
   */
  async loadSkillsByCategory(category) {
    const categoryPath = path.join(this.skillsPath, category);
    
    try {
      const exists = await this.pathExists(categoryPath);
      if (!exists) {
        console.log(`📁 Creating ${category} skills directory...`);
        await fs.mkdir(categoryPath, { recursive: true });
        return;
      }

      const skillDirs = await fs.readdir(categoryPath);
      
      for (const skillDir of skillDirs) {
        const skillPath = path.join(categoryPath, skillDir);
        const stat = await fs.stat(skillPath);
        
        if (stat.isDirectory()) {
          await this.loadSkill(category, skillDir, skillPath);
        }
      }
    } catch (error) {
      console.error(`Error loading ${category} skills:`, error);
    }
  }

  /**
   * Tek bir skill yükler
   */
  async loadSkill(category, skillName, skillPath) {
    try {
      const skillFile = path.join(skillPath, 'SKILL.md');
      const exists = await this.pathExists(skillFile);
      
      if (!exists) {
        console.warn(`⚠️ SKILL.md not found for ${skillName}`);
        return null;
      }

      const content = await fs.readFile(skillFile, 'utf-8');
      const metadata = this.parseSkillMetadata(content);
      
      const skill = {
        id: `${category}-${skillName}`,
        name: skillName,
        category: category,
        path: skillPath,
        content: content,
        metadata: metadata,
        enabled: true,
        loadedAt: new Date()
      };

      this.loadedSkills.set(skill.id, skill);
      console.log(`  ✓ Loaded: ${skill.id}`);
      
      return skill;
    } catch (error) {
      console.error(`Error loading skill ${skillName}:`, error);
      return null;
    }
  }

  /**
   * Skill metadata'sını parse eder (YAML front matter)
   */
  parseSkillMetadata(content) {
    const metadata = {
      title: '',
      description: '',
      version: '1.0.0',
      tags: [],
      triggers: []
    };

    // YAML front matter varsa parse et
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (yamlMatch) {
      const yamlContent = yamlMatch[1];
      const lines = yamlContent.split('\n');
      
      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (key && value) {
          const cleanKey = key.trim();
          const cleanValue = value.replace(/['"]/g, '');
          
          if (cleanKey === 'tags' || cleanKey === 'triggers') {
            metadata[cleanKey] = cleanValue.split(',').map(t => t.trim());
          } else {
            metadata[cleanKey] = cleanValue;
          }
        }
      });
    } else {
      // Başlıktan bilgi al
      const titleMatch = content.match(/^#\s+(.+)/m);
      if (titleMatch) {
        metadata.title = titleMatch[1];
      }
    }

    return metadata;
  }

  /**
   * Skill ID'ye göre skill döndürür
   */
  getSkill(skillId) {
    return this.loadedSkills.get(skillId);
  }

  /**
   * İsme göre skill arar
   */
  findSkillByName(name) {
    for (const skill of this.loadedSkills.values()) {
      if (skill.name.toLowerCase() === name.toLowerCase()) {
        return skill;
      }
    }
    return null;
  }

  /**
   * Kategoriye göre skill'leri döndürür
   */
  getSkillsByCategory(category) {
    const skills = [];
    for (const skill of this.loadedSkills.values()) {
      if (skill.category === category) {
        skills.push(skill);
      }
    }
    return skills;
  }

  /**
   * Trigger'a göre skill bulur
   */
  findSkillsByTrigger(userMessage) {
    const matchedSkills = [];
    const lowerMessage = userMessage.toLowerCase();

    for (const skill of this.loadedSkills.values()) {
      if (!skill.enabled) continue;

      const triggers = skill.metadata.triggers || [];
      for (const trigger of triggers) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          matchedSkills.push({
            skill: skill,
            trigger: trigger,
            confidence: this.calculateConfidence(lowerMessage, trigger)
          });
        }
      }
    }

    // Güvene göre sırala
    matchedSkills.sort((a, b) => b.confidence - a.confidence);
    return matchedSkills;
  }

  /**
   * Trigger eşleşme güvenini hesaplar
   */
  calculateConfidence(message, trigger) {
    const triggerWords = trigger.toLowerCase().split(' ');
    const messageWords = message.toLowerCase().split(' ');
    
    let matchCount = 0;
    triggerWords.forEach(tw => {
      if (messageWords.includes(tw)) matchCount++;
    });

    return matchCount / triggerWords.length;
  }

  /**
   * Skill'i yeniden yükler
   */
  async reloadSkill(skillId) {
    const skill = this.loadedSkills.get(skillId);
    if (!skill) return null;

    return await this.loadSkill(skill.category, skill.name, skill.path);
  }

  /**
   * Tüm skill'leri yeniden yükler
   */
  async reloadAllSkills() {
    this.loadedSkills.clear();
    return await this.loadAllSkills();
  }

  /**
   * Skill enable/disable
   */
  toggleSkill(skillId, enabled) {
    const skill = this.loadedSkills.get(skillId);
    if (skill) {
      skill.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Skill listesini döndürür
   */
  listSkills() {
    return Array.from(this.loadedSkills.values()).map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      title: skill.metadata.title,
      description: skill.metadata.description,
      enabled: skill.enabled,
      tags: skill.metadata.tags
    }));
  }

  /**
   * Path varlık kontrolü
   */
  async pathExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Skill istatistikleri
   */
  getStats() {
    const stats = {
      total: this.loadedSkills.size,
      byCategory: {},
      enabled: 0,
      disabled: 0
    };

    for (const skill of this.loadedSkills.values()) {
      // Kategori sayıları
      stats.byCategory[skill.category] = (stats.byCategory[skill.category] || 0) + 1;
      
      // Aktif/pasif sayıları
      if (skill.enabled) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }
    }

    return stats;
  }
}

module.exports = new SkillLoader();