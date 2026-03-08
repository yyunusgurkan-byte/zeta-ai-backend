const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://api.football-data.org/v4';
const SPORTSDB_URL = 'https://www.thesportsdb.com/api/v1/json/3';

const LIG_IDS = {
  superlig:   '4339',
  premier:    '4328',
  laliga:     '4335',
  bundesliga: '4331',
  seriea:     '4332',
}

// ── STANDINGS ──────────────────────────────────────────────
router.get('/standings/:lig', async (req, res) => {
  try {
    const ligId = LIG_IDS[req.params.lig] || LIG_IDS.superlig
    const now = new Date()
    const y = now.getFullYear()
    // Futbol sezonu Ağustos'ta başlar
    const season = now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`

    const response = await axios.get(
      `${SPORTSDB_URL}/lookuptable.php?l=${ligId}&s=${season}`
    )

    const table = response.data.table || []
    const standings = table.map(t => ({
      rank:         parseInt(t.intRank),
      team:         t.strTeam,
      logo:         t.strTeamBadge,
      played:       parseInt(t.intPlayed),
      win:          parseInt(t.intWin),
      draw:         parseInt(t.intDraw),
      lose:         parseInt(t.intLoss),
      goalsFor:     parseInt(t.intGoalsFor),
      goalsAgainst: parseInt(t.intGoalsAgainst),
      goalDiff:     parseInt(t.intGoalDifference),
      points:       parseInt(t.intPoints),
      form:         t.strForm || '',
    }))

    res.json({ success: true, standings, lig: req.params.lig })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ── LIVE ───────────────────────────────────────────────────
router.get('/live', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/matches?status=LIVE`, {
      headers: { 'X-Auth-Token': API_KEY }
    });
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