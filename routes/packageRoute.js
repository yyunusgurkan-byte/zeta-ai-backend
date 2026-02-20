// backend/routes/packageRoute.js
const express = require('express');
const { packageAnalyzerHandler } = require('../tools/packageAnalyzer');

const router = express.Router();

// POST /api/analyze-packages
router.post('/analyze-packages', packageAnalyzerHandler);

module.exports = router;
