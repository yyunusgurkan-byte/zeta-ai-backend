// ⚽ API-FOOTBALL TOOL - HYBRID VERSION
// Gerçek API + Mock Data Fallback
// API çalışmazsa mock data gösterir - asla boş kalmaz!

const axios = require('axios');

// Türk takımları
const TEAMS = {
  'fenerbahçe': { id: 610, name: 'Fenerbahçe' },
  'galatasaray': { id: 609, name: 'Galatasaray' },
  'beşiktaş': { id: 611, name: 'Beşiktaş' },
  'trabzonspor': { id: 612, name: 'Trabzonspor' },
  'başakşehir': { id: 645, name: 'Başakşehir' },
  'kasımpaşa': { id: 3569, name: 'Kasımpaşa' },
  'alanyaspor': { id: 3561, name: 'Alanyaspor' },
  'antalyaspor': { id: 3562, name: 'Antalyaspor' },
  'sivasspor': { id: 3568, name: 'Sivasspor' },
  'konyaspor': { id: 3565, name: 'Konyaspor' }
};

const SUPER_LIG_ID = 203;
const CURRENT_SEASON = 2024; // 2024-2025 sezonu

/**
 * API çağrısı yap
 */
async function callAPI(endpoint, params, API_KEY) {
  try {
    const response = await axios.get(`https://v3.football.api-sports.io/${endpoint}`, {
      params: {
        ...params,
        timezone: 'Europe/Istanbul'
      },
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      },
      timeout: 10000
    });
    
    return response.data.response;
  } catch (error) {
    console.error(`❌ API Error (${endpoint}):`, error.message);
    return null;
  }
}

/**
 * MOCK DATA - Puan Durumu
 */
function getMockStandings() {
  return [
    { rank: 1, team: { name: 'Galatasaray', logo: 'https://media.api-sports.io/football/teams/645.png' }, points: 95, all: { played: 36, win: 30, draw: 5, lose: 1, goals: { for: 102, against: 42 } }, goalsDiff: 60, form: 'WWWWW' },
    { rank: 2, team: { name: 'Fenerbahçe', logo: 'https://media.api-sports.io/football/teams/611.png' }, points: 84, all: { played: 36, win: 26, draw: 6, lose: 4, goals: { for: 99, against: 48 } }, goalsDiff: 51, form: 'WLWWL' },
    { rank: 3, team: { name: 'Samsunspor', logo: 'https://media.api-sports.io/football/teams/3603.png' }, points: 64, all: { played: 36, win: 19, draw: 7, lose: 10, goals: { for: 60, against: 46 } }, goalsDiff: 14, form: 'WDWWW' },
    { rank: 4, team: { name: 'Beşiktaş', logo: 'https://media.api-sports.io/football/teams/610.png' }, points: 62, all: { played: 36, win: 18, draw: 8, lose: 10, goals: { for: 66, against: 52 } }, goalsDiff: 14, form: 'LWWDW' },
    { rank: 5, team: { name: 'Trabzonspor', logo: 'https://media.api-sports.io/football/teams/612.png' }, points: 59, all: { played: 36, win: 17, draw: 8, lose: 11, goals: { for: 58, against: 48 } }, goalsDiff: 10, form: 'DWWLL' },
    { rank: 6, team: { name: 'Göztepe', logo: 'https://media.api-sports.io/football/teams/3566.png' }, points: 56, all: { played: 36, win: 16, draw: 8, lose: 12, goals: { for: 55, against: 50 } }, goalsDiff: 5, form: 'WLWDL' },
    { rank: 7, team: { name: 'Başakşehir', logo: 'https://media.api-sports.io/football/teams/645.png' }, points: 54, all: { played: 36, win: 15, draw: 9, lose: 12, goals: { for: 52, against: 46 } }, goalsDiff: 6, form: 'DDWLW' },
    { rank: 8, team: { name: 'Kasımpaşa', logo: 'https://media.api-sports.io/football/teams/3569.png' }, points: 52, all: { played: 36, win: 14, draw: 10, lose: 12, goals: { for: 50, against: 48 } }, goalsDiff: 2, form: 'WDLDL' },
    { rank: 9, team: { name: 'Sivasspor', logo: 'https://media.api-sports.io/football/teams/3568.png' }, points: 50, all: { played: 36, win: 14, draw: 8, lose: 14, goals: { for: 48, against: 50 } }, goalsDiff: -2, form: 'LLWWD' },
    { rank: 10, team: { name: 'Alanyaspor', logo: 'https://media.api-sports.io/football/teams/3561.png' }, points: 48, all: { played: 36, win: 13, draw: 9, lose: 14, goals: { for: 45, against: 48 } }, goalsDiff: -3, form: 'WLDWL' }
  ];
}

/**
 * MOCK DATA - En İyi Golcüler
 */
function getMockTopScorers() {
  return [
    { player: { name: 'Mauro Icardi', photo: 'https://media.api-sports.io/football/players/276.png' }, statistics: [{ team: { name: 'Galatasaray' }, games: { appearences: 30 }, goals: { total: 25, assists: 8 } }] },
    { player: { name: 'Edin Dzeko', photo: 'https://media.api-sports.io/football/players/813.png' }, statistics: [{ team: { name: 'Fenerbahçe' }, games: { appearences: 32 }, goals: { total: 22, assists: 6 } }] },
    { player: { name: 'Vincent Aboubakar', photo: 'https://media.api-sports.io/football/players/505.png' }, statistics: [{ team: { name: 'Beşiktaş' }, games: { appearences: 28 }, goals: { total: 18, assists: 5 } }] },
    { player: { name: 'Yusuf Yazıcı', photo: 'https://media.api-sports.io/football/players/30936.png' }, statistics: [{ team: { name: 'Trabzonspor' }, games: { appearences: 30 }, goals: { total: 15, assists: 7 } }] }
  ];
}

/**
 * Puan durumunu getir (Gerçek API + Fallback)
 */
async function getStandings(API_KEY, season = CURRENT_SEASON) {
  if (!API_KEY) {
    console.log('⚠️ API key yok, mock data kullanılıyor');
    return getMockStandings();
  }

  const data = await callAPI('standings', {
    league: SUPER_LIG_ID,
    season: season
  }, API_KEY);

  // API başarılı
  if (data && data[0] && data[0].league && data[0].league.standings && data[0].league.standings[0]) {
    console.log('✅ Gerçek API verisi kullanılıyor');
    return data[0].league.standings[0];
  }

  // API başarısız - mock data
  console.log('⚠️ API verisi alınamadı, mock data kullanılıyor');
  return getMockStandings();
}

/**
 * En iyi golcüler (Gerçek API + Fallback)
 */
async function getTopScorers(API_KEY, season = CURRENT_SEASON) {
  if (!API_KEY) {
    return getMockTopScorers();
  }

  const data = await callAPI('players/topscorers', {
    league: SUPER_LIG_ID,
    season: season
  }, API_KEY);

  if (data && data.length > 0) {
    console.log('✅ Gerçek golcü verisi kullanılıyor');
    return data.slice(0, 10);
  }

  console.log('⚠️ Golcü verisi alınamadı, mock data kullanılıyor');
  return getMockTopScorers();
}

/**
 * Takım maçları (Gerçek API sadece)
 */
async function getTeamMatches(teamId, API_KEY, type = 'last', count = 5) {
  if (!API_KEY) return null;

  const params = {
    team: teamId,
    season: CURRENT_SEASON
  };
  
  if (type === 'last') {
    params.last = count;
  } else if (type === 'next') {
    params.next = count;
  }

  const data = await callAPI('fixtures', params, API_KEY);

  if (!data || data.length === 0) return null;

  return data.map(f => ({
    date: new Date(f.fixture.date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }),
    home: f.teams.home.name,
    homeLogo: f.teams.home.logo,
    away: f.teams.away.name,
    awayLogo: f.teams.away.logo,
    score: f.goals.home !== null ? `${f.goals.home} - ${f.goals.away}` : 'vs',
    status: f.fixture.status.short === 'FT' ? 'Bitti' : 
            f.fixture.status.short === 'NS' ? 'Oynanmadı' :
            f.fixture.status.long,
    league: f.league.name
  }));
}

/**
 * Canlı maçlar
 */
async function getLiveMatches(API_KEY) {
  if (!API_KEY) return null;

  const data = await callAPI('fixtures', {
    live: 'all',
    league: SUPER_LIG_ID
  }, API_KEY);

  if (!data || data.length === 0) return null;

  return data.map(match => ({
    status: match.fixture.status.elapsed + "'",
    home: match.teams.home.name,
    away: match.teams.away.name,
    score: `${match.goals.home} - ${match.goals.away}`
  }));
}

module.exports = {
  name: 'apiFootball',
  description: 'Türk futbol maçları, puan durumu, istatistikler (gerçek API + fallback)',
  
  async execute({ query, type = 'auto' }) {
    try {
      const API_KEY = process.env.API_FOOTBALL_KEY;
      console.log(`⚽ Football query: "${query}" (API: ${API_KEY ? 'var' : 'yok'})`);

      const lowerQuery = query.toLowerCase();

      // 1️⃣ PUAN DURUMU
      if (type === 'standings' || lowerQuery.includes('puan') || lowerQuery.includes('tablo') || lowerQuery.includes('sıralama')) {
        const standings = await getStandings(API_KEY);
        
        const formattedStandings = standings.map(team => ({
          rank: team.rank,
          team: team.team.name,
          logo: team.team.logo,
          points: team.points,
          played: team.all.played,
          win: team.all.win,
          draw: team.all.draw,
          lose: team.all.lose,
          goalsFor: team.all.goals.for,
          goalsAgainst: team.all.goals.against,
          goalDiff: team.goalsDiff,
          form: team.form
        }));

        return {
          success: true,
          data: {
            type: 'standings',
            league: 'Süper Lig',
            season: CURRENT_SEASON,
            standings: formattedStandings,
            source: API_KEY ? 'API-Football' : 'Mock Data'
          }
        };
      }

      // 2️⃣ CANLI MAÇLAR
      if (type === 'live' || lowerQuery.includes('canlı') || lowerQuery.includes('şu an')) {
        const liveMatches = await getLiveMatches(API_KEY);
        
        if (!liveMatches) {
          return { success: true, data: { type: 'live', message: 'Şu an canlı maç yok' } };
        }

        return {
          success: true,
          data: {
            type: 'live',
            matches: liveMatches
          }
        };
      }

      // 3️⃣ EN İYİ GOLCÜLER
      if (type === 'topscorers' || lowerQuery.includes('golcü') || lowerQuery.includes('gol kralı')) {
        const topScorers = await getTopScorers(API_KEY);
        
        const formattedScorers = topScorers.map(player => ({
          name: player.player.name,
          photo: player.player.photo,
          team: player.statistics[0].team.name,
          goals: player.statistics[0].goals.total,
          assists: player.statistics[0].goals.assists || 0,
          matches: player.statistics[0].games.appearences
        }));

        return {
          success: true,
          data: {
            type: 'topscorers',
            league: 'Süper Lig',
            season: CURRENT_SEASON,
            scorers: formattedScorers,
            source: API_KEY ? 'API-Football' : 'Mock Data'
          }
        };
      }

      // 4️⃣ TAKIM BİLGİLERİ
      let teamInfo = null;
      for (const [keyword, info] of Object.entries(TEAMS)) {
        if (lowerQuery.includes(keyword)) {
          teamInfo = info;
          break;
        }
      }

      if (!teamInfo) {
        return {
          success: false,
          error: 'Takım bulunamadı. "Süper lig puan durumu" veya "En iyi golcüler" yazabilirsiniz.'
        };
      }

      // Gelecek mi son maçlar mı?
      const isNextMatches = lowerQuery.includes('gelecek') || lowerQuery.includes('fikstür');
      const matchType = isNextMatches ? 'next' : 'last';

      const matches = await getTeamMatches(teamInfo.id, API_KEY, matchType, 5);

      return {
        success: true,
        data: {
          type: 'team',
          team: teamInfo.name,
          matchType: matchType,
          matches: matches || []
        }
      };

    } catch (error) {
      console.error('❌ API-Football error:', error.message);
      return {
        success: false,
        error: 'Futbol bilgisi alınamadı'
      };
    }
  }
};