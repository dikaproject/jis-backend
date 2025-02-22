const router = require('express').Router();
const { analyzeMood, analyzeRateLimit, checkUsage } = require('../controllers/imageaiController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Analyze image with rate limiting
router.post('/analyze', analyzeRateLimit, upload.single('image'), analyzeMood);

// Check remaining analyses
router.get('/usage/:userId', checkUsage);

module.exports = router;