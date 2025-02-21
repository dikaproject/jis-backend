const router = require('express').Router();
const { createMood, getMoodHistory } = require('../controllers/MoodController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createMood);
router.get('/history', auth, getMoodHistory);

module.exports = router;