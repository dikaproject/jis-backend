const prisma = require('../config/database');
const axios = require('axios');
const { MENTAL_HEALTH_QUESTIONS } = require('../constants/questions');

const analyzeWithGroq = async (answers) => {
  try {
    const formattedAnswers = Object.entries(answers).map(([key, value]) => ({
      question: MENTAL_HEALTH_QUESTIONS[key].question,
      answer: value,
      scale_meaning: MENTAL_HEALTH_QUESTIONS[key].scale[value]
    }));

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: `As a mental health assessment AI, analyze these questionnaire responses and provide the analysis in strict JSON format without any additional text or explanation. Each answer is rated 1-5 (1=worst, 5=best).

Responses:
${JSON.stringify(formattedAnswers, null, 2)}

Response must be valid JSON matching this exact structure:
{
  "score": <number between 0-100>,
  "analysis": "<brief overview>",
  "concerns": ["<concern1>", "<concern2>", "<concern3>"],
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "recommendations": ["<rec1>", "<rec2>", "<rec3>"],
  "activities": ["<activity1>", "<activity2>", "<activity3>"],
  "seekProfessionalHelp": <boolean>
}`
      }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      }
    });

    const content = response.data.choices[0].message.content.trim();
    
    // Try to extract JSON if wrapped in code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
    const jsonStr = jsonMatch[1].trim();
    
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError);
      return generateFallbackAnalysis(answers);
    }
  } catch (error) {
    console.error('Groq AI Analysis Error:', error);
    return generateFallbackAnalysis(answers);
  }
};

const generateFallbackAnalysis = (answers) => {
  const avgScore = Object.values(answers).reduce((a, b) => a + b, 0) / Object.keys(answers).length;
  const normalizedScore = Math.round((avgScore / 5) * 100);

  return {
    score: normalizedScore,
    analysis: "Based on the provided responses, an automated assessment has been generated.",
    concerns: [
      "Areas scoring below average require attention",
      "Consider monitoring lower-scored aspects",
      "Regular emotional well-being check-ins recommended"
    ],
    strengths: [
      "Areas scoring above average indicate resilience",
      "Existing positive coping mechanisms identified",
      "Foundation for improvement present"
    ],
    recommendations: [
      "Maintain consistent daily routines",
      "Practice regular self-care activities",
      "Build on existing support systems"
    ],
    activities: [
      "Morning mindfulness practice",
      "Daily physical activity",
      "Evening reflection journal"
    ],
    seekProfessionalHelp: normalizedScore < 60
  };
};

const getQuestions = async (req, res) => {
  try {
    res.status(200).json(MENTAL_HEALTH_QUESTIONS);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitQuestionnaire = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user.id;

    // Check if user already has a questionnaire
    const existingQuestionnaire = await prisma.questionnaire.findUnique({
      where: { userId }
    });

    if (existingQuestionnaire) {
      return res.status(400).json({ message: "Questionnaire already submitted" });
    }

    const aiAnalysis = await analyzeWithGroq(answers);

    const questionnaire = await prisma.questionnaire.create({
      data: {
        userId,
        answers,
        mentalScore: aiAnalysis.score,
        recommendations: aiAnalysis
      }
    });

    // Create pet after questionnaire
    await prisma.pet.create({
      data: {
        userId,
        name: "SolvanaPet",
        stage: "EGG",
      }
    });

    res.status(201).json({
      questionnaire: {
        id: questionnaire.id,
        mentalScore: aiAnalysis.score,
        analysis: {
          overview: aiAnalysis.analysis,
          concerns: aiAnalysis.concerns,
          strengths: aiAnalysis.strengths,
          recommendations: aiAnalysis.recommendations,
          dailyActivities: aiAnalysis.activities,
          professionalHelpRecommended: aiAnalysis.seekProfessionalHelp
        },
        createdAt: questionnaire.createdAt
      },
      pet: {
        name: "SolvanaPet",
        stage: "EGG",
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQuestionnaire = async (req, res) => {
  try {
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { userId: req.user.id }
    });

    if (!questionnaire) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }

    res.status(200).json(questionnaire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitQuestionnaire, getQuestionnaire, getQuestions };