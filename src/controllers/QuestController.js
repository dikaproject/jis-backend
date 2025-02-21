const prisma = require('../config/database');

// Generate daily quests
const generateDailyQuests = async (req, res) => {
  try {
    // Delete previous uncompleted quests
    await prisma.dailyQuest.deleteMany({
      where: {
        userId: req.user.id,
        status: 'PENDING'
      }
    });

    // Get active quest templates
    const questTemplates = await prisma.questTemplate.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        difficulty: 'asc'
      },
      take: 3 // Limit to 3 quests per day
    });

    // Create new quests from templates
    const quests = await Promise.all(questTemplates.map(template => 
      prisma.dailyQuest.create({
        data: {
          type: template.type,
          difficulty: template.difficulty,
          userId: req.user.id,
          expReward: template.expReward,
          streakPoints: template.streakPoints,
          title: template.title,
          description: template.description
        }
      })
    ));

    res.status(201).json(quests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete a quest
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

    // Update pet exp and level
    const pet = await prisma.pet.findUnique({
      where: { userId: req.user.id }
    });

    let newExp = pet.exp + quest.expReward;
    let newLevel = pet.level;
    let newStage = pet.stage;

    // Level up logic
    while (newExp >= pet.expToNextLevel) {
      newExp -= pet.expToNextLevel;
      newLevel++;
      
      // Update stage based on level
      if (newLevel === 6) newStage = 'BABY';
      else if (newLevel === 16) newStage = 'TEEN';
      else if (newLevel === 26) newStage = 'ADULT';
    }

    // Update pet
    const updatedPet = await prisma.pet.update({
      where: { userId: req.user.id },
      data: {
        exp: newExp,
        level: newLevel,
        stage: newStage,
        totalExp: { increment: quest.expReward },
        happiness: { increment: 5 }
      }
    });

    // Update streak
    await prisma.streak.upsert({
      where: { userId: req.user.id },
      update: {
        count: { increment: quest.streakPoints },
        lastCheckIn: new Date()
      },
      create: {
        userId: req.user.id,
        count: quest.streakPoints,
        lastCheckIn: new Date()
      }
    });

    res.status(200).json({
      quest,
      pet: updatedPet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateDailyQuests, completeQuest };