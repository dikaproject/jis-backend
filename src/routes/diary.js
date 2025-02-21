const router = require('express').Router();
const { createDiary, getDiaryEntries, deleteDiary } = require('../controllers/DiaryController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createDiary);
router.get('/', auth, getDiaryEntries);
router.delete('/:id', auth, deleteDiary);

module.exports = router;