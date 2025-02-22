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

    // Get random wellness activities and handle empty templates
    const questTemplates = await prisma.questTemplate.findMany({
      where: { isActive: true }
    });

    if (!questTemplates || questTemplates.length === 0) {
      return res.status(404).json({
        message: "No quest templates found. Please contact administrator."
      });
    }

    // Ensure we have at least one template of each type
    const types = ['BREATHING', 'MUSIC', 'VIDEO'];
    const groupedTemplates = questTemplates.reduce((acc, template) => {
      if (!acc[template.type]) acc[template.type] = [];
      acc[template.type].push(template);
      return acc;
    }, {});

    // Check if we have all required quest types
    const missingTypes = types.filter(type => !groupedTemplates[type] || groupedTemplates[type].length === 0);
    if (missingTypes.length > 0) {
      return res.status(404).json({
        message: `Missing quest templates for types: ${missingTypes.join(', ')}`
      });
    }

    // Select one quest of each type
    const selectedQuests = types.map(type => {
      const templates = groupedTemplates[type];
      return templates[Math.floor(Math.random() * templates.length)];
    });

    // Create daily quests with error handling
    try {
      await prisma.dailyQuest.createMany({
        data: selectedQuests.map(template => ({
          userId: req.user.id,
          type: template.type,
          title: template.title,
          description: template.description,
          target: template.duration,
          url: template.url
        }))
      });
    } catch (error) {
      console.error('Error creating daily quests:', error);
      return res.status(500).json({
        message: "Failed to create daily quests",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    const createdQuests = await prisma.dailyQuest.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: today }
      }
    });

    if (!createdQuests || createdQuests.length === 0) {
      return res.status(500).json({
        message: "Failed to retrieve created quests"
      });
    }

    res.status(201).json({
      quests: createdQuests,
      message: "Take time for these self-care activities today"
    });
  } catch (error) {
    console.error('Generate Daily Quests Error:', error);
    res.status(500).json({ 
      message: "Failed to generate daily quests",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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