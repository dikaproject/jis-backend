const prisma = require('../config/database');
const { checkStreakAchievements } = require('./AchievementController');

const generateDailyQuests = async (req, res) => {
  try {
    // Check if user already has active quests for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingQuests = await prisma.dailyQuest.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: today
        }
      }
    });

    if (existingQuests.length > 0) {
      return res.status(200).json(existingQuests);
    }

    // Get all active quest templates
    const questTemplates = await prisma.questTemplate.findMany({
      where: {
        isActive: true
      }
    });

    // Group templates by type
    const groupedTemplates = questTemplates.reduce((acc, template) => {
      if (!acc[template.type]) acc[template.type] = [];
      acc[template.type].push(template);
      return acc;
    }, {});

    // Select one random quest of each type
    const selectedQuests = Object.values(groupedTemplates).map(templates => {
      const randomIndex = Math.floor(Math.random() * templates.length);
      return templates[randomIndex];
    });

    // Create daily quests for user
    const dailyQuests = await prisma.dailyQuest.createMany({
      data: selectedQuests.map(template => ({
        userId: req.user.id,
        type: template.type,
        title: template.title,
        description: template.description,
        target: template.duration,
        status: 'PENDING'
      }))
    });

    const createdQuests = await prisma.dailyQuest.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: today
        }
      }
    });

    res.status(201).json(createdQuests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    
    // Complete the quest
    const quest = await prisma.dailyQuest.update({
      where: { id: parseInt(questId) },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Check if all daily quests are completed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedQuests = await prisma.dailyQuest.count({
      where: {
        userId: req.user.id,
        status: 'COMPLETED',
        createdAt: {
          gte: today
        }
      }
    });

    // If all quests completed, update streak
    if (completedQuests === 3) {
      const streak = await prisma.streak.upsert({
        where: { userId: req.user.id },
        update: {
          count: { increment: 1 },
          maxCount: {
            increment: 1
          },
          lastCheckIn: new Date()
        },
        create: {
          userId: req.user.id,
          count: 1,
          maxCount: 1,
          lastCheckIn: new Date()
        }
      });

      // Check for new achievements
      const newAchievements = await checkStreakAchievements(req.user.id);

      res.status(200).json({
        quest,
        streak,
        dailyStatus: 'All quests completed!',
        newAchievements: newAchievements.length > 0 ? newAchievements : null
      });
    } else {
      res.status(200).json({
        quest,
        dailyStatus: `${completedQuests}/3 quests completed`
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateDailyQuests, completeQuest };