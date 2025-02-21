const prisma = require('../config/database');

const checkStreakAchievements = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pet: {
          include: { achievements: true }
        },
        streaks: {
          orderBy: { count: 'desc' },
          take: 1
        }
      }
    });

    const pet = user.pet;
    const currentStreak = user.streaks[0]?.count || 0;
    const existingAchievements = pet.achievements.map(a => a.type);
    const newAchievements = [];

    // Check streak milestones
    const streakMilestones = [
      { days: 200, type: 'STREAK_200_DAYS' },
      { days: 100, type: 'STREAK_100_DAYS' },
      { days: 30, type: 'STREAK_30_DAYS' },
      { days: 10, type: 'STREAK_10_DAYS' }
    ];

    for (const milestone of streakMilestones) {
      if (currentStreak >= milestone.days && !existingAchievements.includes(milestone.type)) {
        newAchievements.push({
          type: milestone.type,
          petId: pet.id
        });
      }
    }

    if (newAchievements.length > 0) {
      await prisma.petAchievement.createMany({
        data: newAchievements
      });
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking streak achievements:', error);
    return [];
  }
};

const getAchievements = async (req, res) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { userId: req.user.id },
      include: {
        achievements: {
          orderBy: { unlockedAt: 'desc' }
        }
      }
    });

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    const achievementsWithDetails = pet.achievements.map(achievement => ({
      ...achievement,
      description: getAchievementDescription(achievement.type),
      icon: getAchievementIcon(achievement.type)
    }));

    res.status(200).json({
      currentAchievements: achievementsWithDetails,
      nextMilestone: await getNextMilestones(req.user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAchievementDescription = (type) => {
  const descriptions = {
    STREAK_10_DAYS: '10 days of consistent wellness practice',
    STREAK_30_DAYS: 'A month of dedicated self-care',
    STREAK_100_DAYS: '100 days of mental wellness journey',
    STREAK_200_DAYS: 'Incredible 200-day wellness streak!'
  };
  return descriptions[type];
};

const getAchievementIcon = (type) => {
  return `/icons/achievements/${type.toLowerCase()}.png`;
};

const getNextMilestones = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      streaks: {
        orderBy: { count: 'desc' },
        take: 1
      }
    }
  });

  const currentStreak = user.streaks[0]?.count || 0;
  const milestones = [10, 30, 100, 200];
  
  const nextMilestone = milestones.find(m => m > currentStreak) || 'Max achieved!';
  const daysToNext = nextMilestone - currentStreak;

  return {
    currentStreak,
    nextMilestone,
    daysToNext: typeof nextMilestone === 'number' ? daysToNext : 0,
    progress: typeof nextMilestone === 'number' ? 
      Math.floor((currentStreak / nextMilestone) * 100) : 100
  };
};

module.exports = { 
  checkStreakAchievements, 
  getAchievements 
};