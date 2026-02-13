const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// TEST ENDPOINT
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Upload route çalışıyor!' });
});

// Multer config - memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files allowed!'));
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('📥 Upload request received');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    res.json({
      success: true,
      imageUrl: dataUrl,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('❌ Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;