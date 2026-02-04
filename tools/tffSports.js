// ⚽ TFF SPORTS TOOL
// Türkiye Süper Lig puan durumu ve maç bilgileri (RapidAPI - API-Football)

const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'api-football-v1.p.rapidapi.com';
const SUPER_LIG_ID = 203; // Türkiye Süper Lig ID

module.exports = {
  name: 'tffSports',
  description: 'Süper Lig puan durumu ve maç bilgileri',

  /**
   * Spor sorgusu yap
   * @param {Object} params - { query: string }
   */
  async execute({ query }) {
    try {
      console.log(`⚽ Sports query: "${query}"`);

      const lowerQuery = query.toLowerCase();

      // Puan durumu sorgusu
      if (/puan|durumu|sıralama|tablo/i.test(query)) {
        return await this.getStandings();
      }

      // Takım bazlı sorgu
      const teams = {
        'galatasaray': 'Galatasaray',
        'fenerbahçe': 'Fenerbahce',
        'fenerbahce': 'Fenerbahce',
        'beşiktaş': 'Besiktas',
        'besiktas': 'Besiktas',
        'trabzonspor': 'Trabzonspor'
      };

      for (const [teamName, apiName] of Object.entries(teams)) {
        if (lowerQuery.includes(teamName)) {
          return await this.getTeamInfo(apiName);
        }
      }

      // Genel spor bilgisi
      return {
        success: true,
        data: {
          message: 'Süper Lig bilgileri için "puan durumu" veya takım adı sorabilirsiniz.',
          availableQueries: [
            'puan durumu',
            'Galatasaray kaçıncı sırada',
            'Fenerbahçe puan durumu'
          ]
        }
      };

    } catch (error) {
      console.error('❌ Sports error:', error.message);
      return {
        success: false,
        error: 'Spor bilgisi alınamadı'
      };
    }
  },

  /**
   * Puan durumunu getir (Gerçek API-Football)
   */
  async getStandings() {
    // Eğer API key yoksa mock data kullan
    if (!RAPIDAPI_KEY) {
      console.warn('⚠️ RAPIDAPI_KEY bulunamadı, mock data kullanılıyor');
      return this.getMockStandings();
    }

    try {
      const currentYear = new Date().getFullYear();
      const season = currentYear; // 2024-2025 sezonu için 2024

      const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/standings', {
        params: {
          league: SUPER_LIG_ID,
          season: season
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        timeout: 5000
      });

      if (response.data.response && response.data.response.length > 0) {
        const standings = response.data.response[0].league.standings[0];

        return {
          success: true,
          data: {
            league: 'Süper Lig 2024/25',
            standings: standings.slice(0, 10).map(team => ({
              position: team.rank,
              team: team.team.name,
              played: team.all.played,
              won: team.all.win,
              drawn: team.all.draw,
              lost: team.all.lose,
              points: team.points,
              goalsDiff: team.goalsDiff
            })),
            lastUpdate: new Date().toLocaleString('tr-TR'),
            source: 'API-Football (RapidAPI)'
          }
        };
      }

      // API yanıt boşsa mock data
      return this.getMockStandings();

    } catch (error) {
      console.error('❌ API-Football error:', error.message);
      
      // API hatası durumunda mock data
      console.warn('⚠️ API hatası, mock data kullanılıyor');
      return this.getMockStandings();
    }
  },

  /**
   * Takım bilgisi getir
   */
  async getTeamInfo(teamName) {
    if (!RAPIDAPI_KEY) {
      return this.getMockTeamInfo(teamName);
    }

    try {
      const standings = await this.getStandings();
      
      if (standings.success && standings.data.standings) {
        const team = standings.data.standings.find(t => 
          t.team.toLowerCase().includes(teamName.toLowerCase())
        );

        if (team) {
          return {
            success: true,
            data: {
              team: team.team,
              position: team.position,
              played: team.played,
              won: team.won,
              drawn: team.drawn,
              lost: team.lost,
              points: team.points,
              goalsDiff: team.goalsDiff,
              source: 'API-Football (RapidAPI)'
            }
          };
        }
      }

      return this.getMockTeamInfo(teamName);

    } catch (error) {
      console.error('❌ Team info error:', error.message);
      return this.getMockTeamInfo(teamName);
    }
  },

  /**
   * Mock puan durumu (API olmadığında)
   */
  getMockStandings() {
    return {
      success: true,
      data: {
        league: 'Süper Lig 2024/25',
        standings: [
          { position: 1, team: 'Galatasaray', played: 20, won: 15, drawn: 3, lost: 2, points: 48, goalsDiff: 25 },
          { position: 2, team: 'Fenerbahçe', played: 20, won: 14, drawn: 4, lost: 2, points: 46, goalsDiff: 22 },
          { position: 3, team: 'Beşiktaş', played: 20, won: 12, drawn: 5, lost: 3, points: 41, goalsDiff: 15 },
          { position: 4, team: 'Trabzonspor', played: 20, won: 11, drawn: 6, lost: 3, points: 39, goalsDiff: 12 },
          { position: 5, team: 'Başakşehir', played: 20, won: 10, drawn: 6, lost: 4, points: 36, goalsDiff: 8 }
        ],
        lastUpdate: new Date().toLocaleString('tr-TR'),
        source: 'Mock Data (Demo)'
      }
    };
  },

  /**
   * Mock takım bilgisi
   */
  getMockTeamInfo(teamName) {
    const teamData = {
      'Galatasaray': { position: 1, points: 48, played: 20, won: 15, drawn: 3, lost: 2 },
      'Fenerbahce': { position: 2, points: 46, played: 20, won: 14, drawn: 4, lost: 2 },
      'Besiktas': { position: 3, points: 41, played: 20, won: 12, drawn: 5, lost: 3 },
      'Trabzonspor': { position: 4, points: 39, played: 20, won: 11, drawn: 6, lost: 3 }
    };

    const info = teamData[teamName] || teamData['Galatasaray'];

    return {
      success: true,
      data: {
        team: teamName,
        position: info.position,
        points: info.points,
        played: info.played,
        won: info.won,
        drawn: info.drawn,
        lost: info.lost,
        source: 'Mock Data (Demo)'
      }
    };
  }
};
