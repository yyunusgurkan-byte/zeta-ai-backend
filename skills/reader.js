// backend/skills/reader.js
const fs = require('fs');
const path = require('path');

/**
 * Zeta'nın dosya okuma yeteneği.
 * @param {string} relativePath - Proje kökünden dosya yolu (örn: 'frontend/src/App.jsx')
 * @returns {string} Dosya içeriği veya hata mesajı.
 */
const readFileContent = (relativePath) => {
    try {
        // process.cwd() uygulamanın çalıştığı ana dizini verir (zeta-ai)
        const fullPath = path.resolve(process.cwd(), relativePath);

        // Güvenlik Kontrolü: Zeta'nın node_modules veya .env gibi hassas yerleri okumasını engelleyelim
        if (relativePath.includes('node_modules') || relativePath.includes('.env')) {
            return "GÜVENLİK HATASI: Hassas dosyalara erişim engellendi.";
        }

        if (!fs.existsSync(fullPath)) {
            return `HATA: '${relativePath}' yolu üzerinde dosya bulunamadı.`;
        }

        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            return `BİLGİ: '${relativePath}' bir klasördür. İçeriğini görmek için 'tree' komutunu kullanın.`;
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        return content;
    } catch (error) {
        return `SİSTEM HATASI: Dosya okunurken bir problem oluştu: ${error.message}`;
    }
};

module.exports = { readFileContent };