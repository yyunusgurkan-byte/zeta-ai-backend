// 🔢 CALCULATOR TOOL
// Basit matematik işlemleri yapar

module.exports = {
  name: 'calculator',
  description: 'Matematik işlemleri yapar',

  /**
   * Matematik ifadesini hesapla
   * @param {Object} params - { expression: string }
   */
  async execute({ expression }) {
    try {
      console.log(`🔢 Calculating: "${expression}"`);

      // Güvenli hesaplama - eval yerine regex ile parse
      const cleanExpression = expression
        .replace(/x/gi, '*')
        .replace(/÷/g, '/')
        .replace(/[^0-9+\-*/.() ]/g, '');

      // Basit işlemler için regex pattern
      const simplePattern = /^(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)$/;
      const match = cleanExpression.match(simplePattern);

      if (match) {
        const [, num1, operator, num2] = match;
        const a = parseFloat(num1);
        const b = parseFloat(num2);

        let result;
        switch (operator) {
          case '+':
            result = a + b;
            break;
          case '-':
            result = a - b;
            break;
          case '*':
            result = a * b;
            break;
          case '/':
            if (b === 0) {
              return {
                success: false,
                error: 'Sıfıra bölme hatası'
              };
            }
            result = a / b;
            break;
          default:
            return {
              success: false,
              error: 'Geçersiz operatör'
            };
        }

        return {
          success: true,
          data: {
            expression: `${a} ${operator} ${b}`,
            result: result,
            formatted: `${a} ${operator} ${b} = ${result}`
          }
        };
      }

      // Karmaşık işlemler için math.js kullanılabilir (opsiyonel)
      return {
        success: false,
        error: 'Sadece basit işlemler destekleniyor (toplama, çıkarma, çarpma, bölme)'
      };

    } catch (error) {
      console.error('❌ Calculator error:', error.message);
      return {
        success: false,
        error: 'Hesaplama hatası'
      };
    }
  }
};
