const prisma = require('../config/database');
const { checkStreakAchievements } = require('./AchievementController');

const generateDailyQuests = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for existing quests
    const existingQuests = await prisma.dailyQuest.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: today
        }
      }
    });

    if (existingQuests.length > 0) {
      return res.status(200).json({
        quests: existingQuests,
        message: "Focus on completing these wellness activities for better mental health"
      });
    }

    // Get random wellness activities
    const questTemplates = await prisma.questTemplate.findMany({
      where: { isActive: true }
    });

    const groupedTemplates = questTemplates.reduce((acc, template) => {
      if (!acc[template.type]) acc[template.type] = [];
      acc[template.type].push(template);
      return acc;
    }, {});

    const selectedQuests = Object.values(groupedTemplates).map(templates => {
      return templates[Math.floor(Math.random() * templates.length)];
    });

    await prisma.dailyQuest.createMany({
      data: selectedQuests.map(template => ({
        userId: req.user.id,
        type: template.type,
        title: template.title,
        description: template.description,
        target: template.duration
      }))
    });

    const createdQuests = await prisma.dailyQuest.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: today }
      }
    });

    res.status(201).json({
      quests: createdQuests,
      message: "Take time for these self-care activities today"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    
    const quest = await prisma.dailyQuest.update({
      where: { id: parseInt(questId) },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedQuests = await prisma.dailyQuest.count({
      where: {
        userId: req.user.id,
        status: 'COMPLETED',
        createdAt: { gte: today }
      }
    });

    let response = {
      quest,
      message: "Great job taking care of your mental well-being!",
      progress: `${completedQuests}/3 wellness activities completed`
    };

    // Update streak if all daily activities completed
    if (completedQuests === 3) {
      const streak = await prisma.streak.upsert({
        where: { userId: req.user.id },
        update: {
          count: { increment: 1 },
          maxCount: { increment: 1 },
          lastCheckIn: new Date()
        },
        create: {
          userId: req.user.id,
          count: 1,
          maxCount: 1,
          lastCheckIn: new Date()
        }
      });

      const newAchievements = await checkStreakAchievements(req.user.id);

      response = {
        ...response,
        streak: streak.count,
        message: "Amazing! You've completed all your wellness activities for today!",
        newAchievements: newAchievements.length > 0 ? newAchievements : null
      };
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateDailyQuests, completeQuest };