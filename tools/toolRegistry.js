// 🔧 TOOL REGISTRY - Tool Kayıt ve Yönetim Sistemi
// Claude'daki tool ecosystem'e benzer

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaultTools();
  }

  /**
   * Varsayılan toolları kaydet
   */
  registerDefaultTools() {
    console.log('📦 Registering default tools...');

    try {
      // Toolları yükle ve kaydet
      this.register('webSearch', require('./webSearch'));
      this.register('wikipedia', require('./wikipedia'));
      this.register('weather', require('./weather'));
      this.register('calculator', require('./calculator'));
      this.register('tffSports', require('./tffSports'));

      console.log(`✅ ${this.tools.size} tools registered successfully`);
    } catch (error) {
      console.error('❌ Error registering tools:', error.message);
    }
  }

  /**
   * Yeni tool kaydet
   * @param {string} name - Tool adı
   * @param {Object} toolModule - Tool modülü
   */
  register(name, toolModule) {
    if (!toolModule.execute || typeof toolModule.execute !== 'function') {
      throw new Error(`Tool ${name} must have an execute() function`);
    }

    this.tools.set(name, {
      name: toolModule.name || name,
      description: toolModule.description || 'No description',
      execute: toolModule.execute
    });

    console.log(`  ✓ ${name}`);
  }

  /**
   * Tool çalıştır
   * @param {string} toolName - Tool adı
   * @param {Object} params - Parametreler
   */
  async execute(toolName, params) {
    if (!this.tools.has(toolName)) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`
      };
    }

    const tool = this.tools.get(toolName);

    try {
      console.log(`🔧 Executing tool: ${toolName}`, params);
      const startTime = Date.now();

      const result = await tool.execute(params);

      const duration = Date.now() - startTime;
      console.log(`✅ Tool completed in ${duration}ms`);

      return result;

    } catch (error) {
      console.error(`❌ Tool execution error (${toolName}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Kayıtlı toolları listele
   */
  list() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description
    }));
  }

  /**
   * Tool var mı kontrol et
   */
  has(toolName) {
    return this.tools.has(toolName);
  }

  /**
   * Tool kaldır
   */
  unregister(toolName) {
    if (this.tools.has(toolName)) {
      this.tools.delete(toolName);
      console.log(`🗑️ Tool unregistered: ${toolName}`);
      return true;
    }
    return false;
  }
}

module.exports = ToolRegistry;
