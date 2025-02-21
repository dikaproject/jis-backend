const router = require('express').Router();
const { getAchievements } = require('../controllers/AchievementController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getAchievements);

module.exports = router;