const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

router.get('/live', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/matches?status=LIVE`, {
      headers: { 'X-Auth-Token': API_KEY }
    });
    
    // football-data.org formatını eski formata çevir
    const matches = response.data.matches || [];
    const converted = matches.map(m => ({
      fixture: {
        id: m.id,
        status: { long: m.status, elapsed: m.minute || 0 },
        league: { name: m.competition.name, round: m.matchday }
      },
      teams: {
        home: { id: m.homeTeam.id, name: m.homeTeam.name, logo: m.homeTeam.crest },
        away: { id: m.awayTeam.id, name: m.awayTeam.name, logo: m.awayTeam.crest }
      },
      goals: {
        home: m.score.fullTime.home ?? m.score.halfTime.home ?? 0,
        away: m.score.fullTime.away ?? m.score.halfTime.away ?? 0
      }
    }));

    res.json({ response: converted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/statistics/:fixtureId', async (req, res) => {
  res.json({ response: [] });
});

router.get('/events/:fixtureId', async (req, res) => {
  res.json({ response: [] });
});

module.exports = router;