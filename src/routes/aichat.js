const router = require('express').Router();
const { chatWithAI } = require('../controllers/aichat');
const { auth } = require('../middleware/auth');

router.post('/chat', auth, chatWithAI);

module.exports = router;