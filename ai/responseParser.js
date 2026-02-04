// backend/ai/responseParser.js

class ResponseParser {
  /**
   * GROQ API yanıtını parse eder
   */
  parseCompletion(completion) {
    if (!completion || !completion.choices || completion.choices.length === 0) {
      return {
        type: 'error',
        content: 'No response from AI',
        metadata: {}
      };
    }

    const choice = completion.choices[0];
    const message = choice.message;

    // Tool call var mı?
    if (message.tool_calls && message.tool_calls.length > 0) {
      return {
        type: 'tool_call',
        toolCalls: this.parseToolCalls(message.tool_calls),
        content: message.content || '',
        metadata: {
          finish_reason: choice.finish_reason,
          usage: completion.usage
        }
      };
    }

    // Normal text yanıt
    return {
      type: 'text',
      content: message.content || '',
      metadata: {
        finish_reason: choice.finish_reason,
        usage: completion.usage
      }
    };
  }

  /**
   * Tool call'ları parse eder
   */
  parseToolCalls(toolCalls) {
    return toolCalls.map(call => {
      let args = {};
      
      try {
        args = typeof call.function.arguments === 'string' 
          ? JSON.parse(call.function.arguments)
          : call.function.arguments;
      } catch (error) {
        console.error('Failed to parse tool arguments:', error);
        args = { raw: call.function.arguments };
      }

      return {
        id: call.id,
        name: call.function.name,
        arguments: args
      };
    });
  }

  /**
   * Streaming chunk'ları birleştirir
   */
  mergeStreamChunks(chunks) {
    let content = '';
    let toolCalls = [];

    for (const chunk of chunks) {
      if (chunk.type === 'content') {
        content += chunk.content;
      } else if (chunk.type === 'tool_call') {
        toolCalls.push(...chunk.tool_calls);
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? this.parseToolCalls(toolCalls) : null
    };
  }

  /**
   * Markdown formatını tespit eder
   */
  detectMarkdown(text) {
    const patterns = {
      codeBlock: /```[\s\S]*?```/g,
      inlineCode: /`[^`]+`/g,
      bold: /\*\*[^*]+\*\*/g,
      italic: /\*[^*]+\*/g,
      link: /\[([^\]]+)\]\(([^)]+)\)/g,
      list: /^[\s]*[-*+]\s/gm,
      numberedList: /^[\s]*\d+\.\s/gm,
      heading: /^#{1,6}\s/gm
    };

    const detected = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      detected[key] = pattern.test(text);
    }

    return detected;
  }

  /**
   * Code block'ları çıkarır
   */
  extractCodeBlocks(text) {
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });
    }

    return blocks;
  }

  /**
   * Link'leri çıkarır
   */
  extractLinks(text) {
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      links.push({
        text: match[1],
        url: match[2]
      });
    }

    return links;
  }

  /**
   * Yanıtı temizler ve formatlar
   */
  cleanResponse(text) {
    if (!text) return '';

    return text
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Fazla boşlukları temizle
      .replace(/\s+$/gm, ''); // Satır sonlarındaki boşlukları temizle
  }

  /**
   * Yanıt analizi
   */
  analyzeResponse(response) {
    const content = response.content || '';
    
    return {
      length: content.length,
      wordCount: content.split(/\s+/).length,
      hasMarkdown: this.detectMarkdown(content),
      codeBlocks: this.extractCodeBlocks(content),
      links: this.extractLinks(content),
      sentiment: this.detectSentiment(content)
    };
  }

  /**
   * Basit duygu analizi
   */
  detectSentiment(text) {
    const positiveWords = ['güzel', 'harika', 'mükemmel', 'teşekkür', 'başarılı', 'iyi'];
    const negativeWords = ['üzgünüm', 'maalesef', 'hata', 'sorun', 'yanlış'];

    const words = text.toLowerCase().split(/\s+/);
    let positive = 0;
    let negative = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positive++;
      if (negativeWords.some(nw => word.includes(nw))) negative++;
    });

    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  /**
   * Hata mesajını formatlar
   */
  formatError(error) {
    return {
      type: 'error',
      content: 'Üzgünüm, bir hata oluştu.',
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = new ResponseParser();