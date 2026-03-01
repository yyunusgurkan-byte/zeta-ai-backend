const axios = require('axios');

const EXCHANGE_KEY = process.env.EXCHANGE_RATE_KEY;

let cache = null;
let cacheTime = null;
const CACHE_TTL = 15 * 60 * 1000;

async function getDovizKripto() {
  if (cache && cacheTime && (Date.now() - cacheTime) < CACHE_TTL) {
    return cache;
  }

  try {
    const dovizRes = await axios.get(
      `https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/USD`,
      { timeout: 8000 }
    );

    const rates = dovizRes.data.conversion_rates;
    const usdToTry = rates.TRY;

    const doviz = [
      { kod: 'USD', isim: 'Amerikan Doları', sembol: '$', try: usdToTry.toFixed(2) },
      { kod: 'EUR', isim: 'Euro', sembol: '€', try: (usdToTry / rates.EUR).toFixed(2) },
      { kod: 'GBP', isim: 'İngiliz Sterlini', sembol: '£', try: (usdToTry / rates.GBP).toFixed(2) },
      { kod: 'JPY', isim: 'Japon Yeni', sembol: '¥', try: (usdToTry / rates.JPY * 100).toFixed(2), not: '100 JPY' },
      { kod: 'CHF', isim: 'İsviçre Frangı', sembol: '₣', try: (usdToTry / rates.CHF).toFixed(2) },
      { kod: 'SAR', isim: 'Suudi Riyali', sembol: '﷼', try: (usdToTry / rates.SAR).toFixed(2) },
      { kod: 'RUB', isim: 'Rus Rublesi', sembol: '₽', try: (usdToTry / rates.RUB).toFixed(2) },
      { kod: 'AED', isim: 'BAE Dirhemi', sembol: 'د.إ', try: (usdToTry / rates.AED).toFixed(2) },
    ];

    // CoinGecko yerine sabit kripto (fallback)
    let kripto = [];
    try {
      const kriptoRes = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd,try',
        { timeout: 6000, headers: { 'Accept': 'application/json' } }
      );
      kripto = Object.entries(kriptoRes.data).map(([id, prices]) => {
        const isimler = { bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana', binancecoin: 'BNB', ripple: 'XRP' };
        const semboller = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', binancecoin: 'BNB', ripple: 'XRP' };
        const renkler = { bitcoin: '#F7931A', ethereum: '#627EEA', solana: '#9945FF', binancecoin: '#F3BA2F', ripple: '#346AA9' };
        return { id, isim: isimler[id], sembol: semboller[id], renk: renkler[id], usd: prices.usd, try: prices.try };
      });
    } catch (kriptoErr) {
      console.log('Kripto alınamadı, sadece döviz gösterilecek');
    }

    const result = {
      success: true,
      guncelleme: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      doviz,
      kripto
    };

    cache = result;
    cacheTime = Date.now();
    return result;

  } catch (err) {
    console.error('Döviz hatası:', err.message);
    if (cache) return { ...cache, eski: true };
    return { success: false, error: err.message };
  }
}

module.exports = { getDovizKripto };