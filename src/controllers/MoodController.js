const prisma = require('../config/database');

const createMood = async (req, res) => {
  try {
    const { type, note } = req.body;
    
    if (!['HAPPY', 'NEUTRAL', 'SAD', 'ANGRY'].includes(type)) {
      return res.status(400).json({
        message: "Mood type must be: HAPPY, NEUTRAL, SAD, or ANGRY"
      });
    }

    const mood = await prisma.mood.create({
      data: {
        userId: req.user.id,
        type,
        note
      }
    });

    const messages = {
      HAPPY: "Wonderful! Keep doing what makes you happy!",
      NEUTRAL: "Maintaining balance is good. Take care of yourself.",
      SAD: "It's okay to feel down. Remember this feeling is temporary.",
      ANGRY: "Take deep breaths. Try to identify what's bothering you."
    };

    const suggestions = {
      HAPPY: [
        "Share your joy with others",
        "Document what made you happy",
        "Plan something fun for tomorrow"
      ],
      NEUTRAL: [
        "Try a mindfulness exercise",
        "Go for a short walk",
        "Listen to some calming music"
      ],
      SAD: [
        "Talk to someone you trust",
        "Do something you enjoy",
        "Practice self-care activities"
      ],
      ANGRY: [
        "Try breathing exercises",
        "Write down your feelings",
        "Take a time-out to cool down"
      ]
    };

    res.status(201).json({
      mood,
      message: messages[type],
      suggestions: suggestions[type]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMoodHistory = async (req, res) => {
  try {
    const { timeframe } = req.query; 
    const date = new Date();
    
    if (timeframe === 'week') {
      date.setDate(date.getDate() - 7);
    } else if (timeframe === 'month') {
      date.setMonth(date.getMonth() - 1);
    } else if (timeframe === 'year') {
      date.setFullYear(date.getFullYear() - 1);
    }

    const moods = await prisma.mood.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: date
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        diary: true
      }
    });

    // Analyze mood patterns
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood.type] = (acc[mood.type] || 0) + 1;
      return acc;
    }, {});

    // Get most frequent mood
    const mostFrequentMood = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    res.status(200).json({
      moods,
      analysis: {
        totalEntries: moods.length,
        moodDistribution: moodCounts,
        mostFrequentMood,
        suggestion: getMoodPatternSuggestion(mostFrequentMood)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function for mood pattern suggestions
const getMoodPatternSuggestion = (mostFrequentMood) => {
  const suggestions = {
    HAPPY: "You're doing great! Keep maintaining these positive vibes.",
    NEUTRAL: "Consider trying new activities to boost your mood.",
    SAD: "It might help to talk to a counselor or trusted friend about your feelings.",
    ANGRY: "Consider learning anger management techniques or stress reduction exercises."
  };

  return suggestions[mostFrequentMood] || "Keep tracking your moods to see patterns.";
};

module.exports = {
  createMood,
  getMoodHistory
};