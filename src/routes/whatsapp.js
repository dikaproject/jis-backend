const router = require('express').Router();
const { sendMorningReminder, sendEveningReminder } = require('../controllers/whatsappController');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/remind/morning', auth, adminOnly, sendMorningReminder);
router.post('/remind/evening', auth, adminOnly, sendEveningReminder);

module.exports = router;