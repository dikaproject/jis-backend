const router = require('express').Router();
const { createQuest, getAllQuests, updateQuest, deleteQuest } = require('../../controllers/admin/QuestController');
const { auth, adminOnly } = require('../../middleware/auth');

router.post('/', auth, adminOnly, createQuest);
router.get('/', auth, adminOnly, getAllQuests);
router.put('/:id', auth, adminOnly, updateQuest);
router.delete('/:id', auth, adminOnly, deleteQuest);

module.exports = router;