const axios = require('axios');

const EXCHANGE_KEY = process.env.EXCHANGE_RATE_KEY;

async function getDovizKripto() {
  try {
    const [dovizRes, kriptoRes] = await Promise.all([
      axios.get(`https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/USD`, { timeout: 8000 }),
      axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd,try', { timeout: 8000 })
    ]);

    const rates = dovizRes.data.conversion_rates;
    const usdToTry = rates.TRY;

    const doviz = [
      { kod: 'USD', isim: 'Amerikan Doları', sembol: '$', try: usdToTry.toFixed(2), degisim: null },
      { kod: 'EUR', isim: 'Euro', sembol: '€', try: (usdToTry / rates.EUR).toFixed(2), degisim: null },
      { kod: 'GBP', isim: 'İngiliz Sterlini', sembol: '£', try: (usdToTry / rates.GBP).toFixed(2), degisim: null },
      { kod: 'JPY', isim: 'Japon Yeni', sembol: '¥', try: (usdToTry / rates.JPY * 100).toFixed(2), not: '100 JPY' },
      { kod: 'CHF', isim: 'İsviçre Frangı', sembol: '₣', try: (usdToTry / rates.CHF).toFixed(2), degisim: null },
      { kod: 'SAR', isim: 'Suudi Riyali', sembol: '﷼', try: (usdToTry / rates.SAR).toFixed(2), degisim: null },
    ];

    const kripto = Object.entries(kriptoRes.data).map(([id, prices]) => {
      const isimler = { bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana', binancecoin: 'BNB', ripple: 'XRP' };
      const semboller = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', binancecoin: 'BNB', ripple: 'XRP' };
      const renkler = { bitcoin: '#F7931A', ethereum: '#627EEA', solana: '#9945FF', binancecoin: '#F3BA2F', ripple: '#346AA9' };
      return {
        id,
        isim: isimler[id],
        sembol: semboller[id],
        renk: renkler[id],
        usd: prices.usd,
        try: prices.try
      };
    });

    return {
      success: true,
      guncelleme: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      doviz,
      kripto
    };

  } catch (err) {
    console.error('Döviz/Kripto hatası:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { getDovizKripto };
