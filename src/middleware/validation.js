const { MENTAL_HEALTH_QUESTIONS } = require('../constants/questions');

const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  next();
};

const validateQuestionnaire = (req, res, next) => {
  const { answers } = req.body;
  
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ message: 'Answers must be provided as an object' });
  }

  const requiredFields = Object.keys(MENTAL_HEALTH_QUESTIONS);
  const missingFields = requiredFields.filter(field => !answers.hasOwnProperty(field));
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  const invalidAnswers = Object.entries(answers)
    .filter(([key, value]) => !Number.isInteger(value) || value < 1 || value > 5);
  
  if (invalidAnswers.length > 0) {
    return res.status(400).json({
      message: 'All answers must be integers between 1 and 5'
    });
  }

  next();
};

module.exports = { validateRegister, validateQuestionnaire };