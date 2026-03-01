const axios = require('axios');

async function getNobetciEczaneler(sehir, ilce = null) {
  const sehirSlug = sehir.toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();

  let url = `https://www.nosyapi.com/apiv2/service/pharmacies-on-duty?city=${sehirSlug}`;
  if (ilce) {
    const ilceSlug = ilce.toLowerCase()
      .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();
    url += `&district=${ilceSlug}`;
  }

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${process.env.NOSYAPI_KEY}`
      }
    });

    const data = response.data;

    if (!data || data.status !== 'success' || !data.data) {
      return { success: false, error: data.message || 'Veri alınamadı', sehir };
    }
    
    const eczaneler = data.data.map(e => ({
     
      ad: e.name || e.eczaneAdi || e.title || e.pharmacyName || Object.values(e).find(v => typeof v === 'string' && v.length > 3 && !v.includes('/') && !v.includes('+')) || '',
      adres: e.address || '',
      telefon: e.phone || '',
      ilce: e.district || '',
    }));

    const sehirGoster = sehir.charAt(0).toUpperCase() + sehir.slice(1).toLowerCase();

    return {
      success: true,
      sehir: sehirGoster,
      tarih: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      eczaneler: eczaneler.slice(0, 30),
      toplam: eczaneler.length,
    };

  } catch (err) {
    console.error('❌ Eczane API hatası:', err.message);
    return { success: false, error: err.message, sehir };
  }
}

module.exports = { getNobetciEczaneler };