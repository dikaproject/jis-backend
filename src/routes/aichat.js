const router = require('express').Router();
const { chatWithAI, getChatHistory } = require('../controllers/aichat');
const { auth } = require('../middleware/auth');

router.post('/chat', auth, chatWithAI);
router.get('/chat/history', auth, getChatHistory);

module.exports = router;