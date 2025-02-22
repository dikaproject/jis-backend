const prisma = require('../config/database');
const axios = require('axios');

const createDiary = async (req, res) => {
  try {
    const { content, moodType, moodNote } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        message: "Please write at least 10 characters in your diary"
      });
    }

    const mood = await prisma.mood.create({
      data: {
        userId: req.user.id,
        type: moodType,
        note: moodNote
      }
    });

    const diary = await prisma.diary.create({
      data: {
        content,
        userId: req.user.id,
        moodId: mood.id
      }
    });

    const supportiveMessage = getSupportiveMessage(moodType, content);

    res.status(201).json({
      diary,
      mood,
      supportiveMessage,
      suggestions: getWellnessSuggestions(moodType)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDiaryEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, moodType } = req.query;
    const skip = (page - 1) * parseInt(limit);

    const where = {
      userId: req.user.id
    };

    if (moodType) {
      where.mood = {
        type: moodType
      };
    }

    const entries = await prisma.diary.findMany({
      where,
      include: {
        mood: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.diary.count({ where });

    // Get mood distribution
    const moodDistribution = await prisma.mood.groupBy({
      by: ['type'],
      where: {
        userId: req.user.id,
        diary: { isNot: null }
      },
      _count: true
    });

    res.status(200).json({
      entries,
      pagination: {
        totalEntries: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        entriesPerPage: parseInt(limit)
      },
      moodDistribution,
      summary: generateMoodSummary(moodDistribution)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDiary = async (req, res) => {
  try {
    const { id } = req.params;

    const diary = await prisma.diary.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id
      }
    });

    if (!diary) {
      return res.status(404).json({ message: "Diary entry not found" });
    }

    await prisma.diary.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: "Diary entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper functions
const getSupportiveMessage = (moodType, content) => {
  const messages = {
    HAPPY: [
      "It's wonderful to see you're feeling happy! Cherish these moments.",
      "Your positive energy shines through your words!",
      "Keep embracing these joyful experiences!"
    ],
    NEUTRAL: [
      "Balance is important. You're doing well!",
      "Taking time to reflect is valuable for your well-being.",
      "Sometimes a neutral day is just what we need."
    ],
    SAD: [
      "It's okay to feel this way. Your feelings are valid.",
      "Remember that difficult times are temporary.",
      "Thank you for sharing your feelings. You're not alone."
    ],
    ANGRY: [
      "It's good that you're expressing your feelings.",
      "Writing about anger is a healthy way to process it.",
      "Take deep breaths and be kind to yourself."
    ]
  };

  const moodMessages = messages[moodType] || messages.NEUTRAL;
  return moodMessages[Math.floor(Math.random() * moodMessages.length)];
};

const getWellnessSuggestions = (moodType) => {
  const suggestions = {
    HAPPY: [
      "Write down three things that made you happy today",
      "Share your joy with someone you care about",
      "Plan something fun for tomorrow"
    ],
    NEUTRAL: [
      "Try a new relaxation technique",
      "Take a mindful walk outside",
      "Listen to your favorite music"
    ],
    SAD: [
      "Reach out to a friend or family member",
      "Practice gentle self-care activities",
      "Try some light exercise or stretching"
    ],
    ANGRY: [
      "Practice deep breathing exercises",
      "Write a letter expressing your feelings (you don't have to send it)",
      "Do some physical activity to release tension"
    ]
  };

  return suggestions[moodType] || suggestions.NEUTRAL;
};

const generateMoodSummary = (moodDistribution) => {
  const total = moodDistribution.reduce((acc, curr) => acc + curr._count, 0);
  const primaryMood = moodDistribution.sort((a, b) => b._count - a._count)[0];

  if (!primaryMood) return "Start writing to track your mood patterns.";

  const percentage = Math.round((primaryMood._count / total) * 100);
  
  return `You've been feeling ${primaryMood.type.toLowerCase()} most often (${percentage}% of entries). ${
    getSupportiveMessage(primaryMood.type)
  }`;
};

module.exports = {
  createDiary,
  getDiaryEntries,
  deleteDiary
};