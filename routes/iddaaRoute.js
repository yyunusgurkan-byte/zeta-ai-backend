const express = require('express');
const router = express.Router();
const { getSuperLigOdds } = require('../tools/iddaa');

router.get('/', async (req, res) => {
  const data = await getSuperLigOdds();
  res.json(data);
});

module.exports = router;
