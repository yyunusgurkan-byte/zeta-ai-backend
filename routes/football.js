const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

router.get('/*', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}${req.path}`, {
      params: req.query,
      headers: { 'x-apisports-key': API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;