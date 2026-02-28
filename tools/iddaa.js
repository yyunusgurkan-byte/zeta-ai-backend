const axios = require('axios');

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

async function getSuperLigOdds() {
  try {
    const response = await axios.get(`${BASE_URL}/sports/soccer_turkey_super_league/odds/`, {
      params: {
        apiKey: ODDS_API_KEY,
        regions: 'eu',
        markets: 'h2h',
        oddsFormat: 'decimal'
      },
      timeout: 10000
    });

    const matches = response.data;

    if (!matches || matches.length === 0) {
      return { success: false, error: 'Maç bulunamadı' };
    }

    // Her maç için ortalama oran hesapla
    const formatted = matches.map(match => {
      const commence = new Date(match.commence_time);
      const tarih = commence.toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const saat = commence.toLocaleTimeString('tr-TR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul'
      });

      // Pinnacle veya ilk bookmaker'dan oran al
      const bm = match.bookmakers.find(b => b.key === 'pinnacle') || match.bookmakers[0];
      const market = bm?.markets?.find(m => m.key === 'h2h');
      
      let homeOdd = null, drawOdd = null, awayOdd = null;
      if (market) {
        const homeOut = market.outcomes.find(o => o.name === match.home_team);
        const awayOut = market.outcomes.find(o => o.name === match.away_team);
        const drawOut = market.outcomes.find(o => o.name === 'Draw');
        homeOdd = homeOut?.price;
        awayOdd = awayOut?.price;
        drawOdd = drawOut?.price;
      }

      // Tüm bookmaker'lardan ortalama hesapla
      const allOdds = { home: [], draw: [], away: [] };
      match.bookmakers.forEach(bm => {
        const m = bm.markets?.find(m => m.key === 'h2h');
        if (!m) return;
        const h = m.outcomes.find(o => o.name === match.home_team);
        const a = m.outcomes.find(o => o.name === match.away_team);
        const d = m.outcomes.find(o => o.name === 'Draw');
        if (h) allOdds.home.push(h.price);
        if (a) allOdds.away.push(a.price);
        if (d) allOdds.draw.push(d.price);
      });

      const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : null;

      return {
        id: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        tarih,
        saat,
        commenceTime: match.commence_time,
        bookmakerCount: match.bookmakers.length,
        odds: {
          home: homeOdd,
          draw: drawOdd,
          away: awayOdd
        },
        avgOdds: {
          home: avg(allOdds.home),
          draw: avg(allOdds.draw),
          away: avg(allOdds.away)
        }
      };
    });

    // Tarihe göre sırala
    formatted.sort((a, b) => new Date(a.commenceTime) - new Date(b.commenceTime));

    return {
      success: true,
      lig: 'Türkiye Süper Lig',
      toplam: formatted.length,
      maclar: formatted
    };

  } catch (err) {
    console.error('❌ Iddaa API hatası:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { getSuperLigOdds };
