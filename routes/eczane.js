// backend/routes/eczane.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getNobetciEczaneler } = require('../tools/eczane');

router.get('/debug/:sehir', async (req, res) => {
  try {
    const { sehir } = req.params;
    const url = `https://www.eczaneler.gen.tr/nobetci-${sehir}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    res.send(response.data);
  } catch(err) {
    res.send('HATA: ' + err.message);
  }
});

router.get('/:sehir', async (req, res) => {
  const { sehir } = req.params;
  if (!sehir || sehir.length < 2) {
    return res.status(400).json({ success: false, message: 'Şehir adı gerekli.' });
  }
  const data = await getNobetciEczaneler(sehir);
  res.json(data);
});
module.exports = router;