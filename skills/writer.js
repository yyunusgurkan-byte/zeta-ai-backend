const fs = require('fs');
const path = require('path');

/**
 * Zeta'nın dosya yazma ve düzeltme yeteneği.
 * @param {string} relativePath - Proje kökünden dosya yolu (örn: 'frontend/src/App.jsx')
 * @param {string} newCode - Zeta tarafından üretilen düzeltilmiş kod
 */
const writeFileContent = (relativePath, newCode) => {
    try {
        const fullPath = path.resolve(process.cwd(), relativePath);

        // Güvenlik: .env veya kritik sistem dosyalarının üzerine yazılmasını önle
        if (relativePath.includes('.env') || relativePath.includes('package-lock.json')) {
            return { success: false, message: "GÜVENLİK: Kritik sistem dosyalarını değiştiremem." };
        }

        fs.writeFileSync(fullPath, newCode, 'utf8');
        return { success: true, message: `${relativePath} dosyası başarıyla güncellendi.` };
    } catch (error) {
        return { success: false, message: `YAZMA HATASI: ${error.message}` };
    }
};

module.exports = { writeFileContent };