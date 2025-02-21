const router = require('express').Router();
const { generateDailyQuests, completeQuest } = require('../controllers/QuestController');
const { auth } = require('../middleware/auth');

router.post('/generate', auth, generateDailyQuests);
router.post('/:questId/complete', auth, completeQuest);

module.exports = router;