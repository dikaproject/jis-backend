const router = require('express').Router();
const { 
  submitQuestionnaire, 
  getQuestionnaire,
  getQuestions 
} = require('../controllers/QuestionnaireController');
const { auth } = require('../middleware/auth');
const { validateQuestionnaire } = require('../middleware/validation');

router.get('/questions', getQuestions);
router.post('/', auth, validateQuestionnaire, submitQuestionnaire);
router.get('/', auth, getQuestionnaire);

module.exports = router;