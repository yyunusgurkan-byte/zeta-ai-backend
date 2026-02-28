const express = require('express');
const router = express.Router();
const { getDovizKripto } = require('../tools/doviz');

router.get('/', async (req, res) => {
  const data = await getDovizKripto();
  res.json(data);
});

module.exports = router;
