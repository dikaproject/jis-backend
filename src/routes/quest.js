const router = require('express').Router();
const { getDailyQuests, completeQuest } = require('../controllers/QuestController');
const { auth } = require('../middleware/auth');

router.get('/daily', auth, getDailyQuests);
router.post('/complete/:questNumber', auth, completeQuest);

module.exports = router;