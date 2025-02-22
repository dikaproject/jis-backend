const prisma = require('../config/database');

// Video quest pool
const VIDEO_QUESTS = [
  {
    url: "https://youtu.be/nkqnuxKj8Dk?si=g73SLzsggNqSXCoU",
    title: "Peaceful Mind Meditation",
    description: "A calming session for inner peace"
  },
  {
    url: "https://youtu.be/inpok4MKVLM?si=XYkTP5KakMfZrByr",
    title: "Mindful Relaxation",
    description: "Guided relaxation for stress relief"
  },
  {
    url: "https://youtu.be/yxu0qHbG_2c?si=HbuM2LJeWL7LnBfo",
    title: "Soothing Meditation",
    description: "Gentle meditation for anxiety relief"
  },
  {
    url: "https://youtu.be/koRbYQyPU0U?si=kChFJyzMoA1o7hwl",
    title: "Calming Visualization",
    description: "Visual journey for mental clarity"
  },
  {
    url: "https://youtu.be/fneClqGElPI?si=5unQPt-MbUJDy0XF",
    title: "Stress Relief Session",
    description: "Guided session for stress management"
  },
  {
    url: "https://youtu.be/xuP4g7IDgDM?si=g3VEqH0iV7pNPODn",
    title: "Deep Relaxation",
    description: "Immersive relaxation experience"
  }
];

const getDailyQuests = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for existing quests
    let dailyQuests = await prisma.dailyQuest.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: today }
      }
    });

    // If no quests exist for today, create 3 random quests
    if (dailyQuests.length === 0) {
      // Randomly select 3 unique videos
      const shuffledQuests = VIDEO_QUESTS.sort(() => Math.random() - 0.5).slice(0, 3);

      await prisma.dailyQuest.createMany({
        data: shuffledQuests.map((quest, index) => ({
          userId: req.user.id,
          questNumber: index + 1,
          status: 'PENDING'
        }))
      });

      dailyQuests = await prisma.dailyQuest.findMany({
        where: {
          userId: req.user.id,
          createdAt: { gte: today }
        }
      });
    }

    // Combine database status with video details
    const formattedQuests = dailyQuests.map(quest => {
      const videoQuest = VIDEO_QUESTS[quest.questNumber - 1];
      return {
        ...quest,
        title: videoQuest.title,
        description: videoQuest.description,
        url: videoQuest.url,
        type: 'VIDEO'
      };
    });

    res.status(200).json({
      quests: formattedQuests,
      message: "Here are your daily meditation videos!"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeQuest = async (req, res) => {
  try {
    const { questNumber } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Complete the quest
    const quest = await prisma.dailyQuest.updateMany({
      where: {
        userId: req.user.id,
        questNumber: parseInt(questNumber),
        createdAt: { gte: today },
        status: 'PENDING'
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    if (quest.count === 0) {
      return res.status(400).json({
        message: "Quest already completed or not found"
      });
    }

    // Check if all quests are completed
    const completedQuests = await prisma.dailyQuest.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: today },
        status: 'COMPLETED'
      }
    });

    // If all 3 quests are completed, increment streak
    if (completedQuests === 3) {
      const streak = await prisma.streak.upsert({
        where: { userId: req.user.id },
        update: {
          count: { increment: 1 },
          lastCheckIn: new Date()
        },
        create: {
          userId: req.user.id,
          count: 1,
          lastCheckIn: new Date()
        }
      });

      // Check for pet evolution
      const pet = await prisma.pet.findUnique({
        where: { userId: req.user.id }
      });

      if (pet) {
        let newStage = pet.stage;
        if (streak.count >= 100) newStage = 'ADULT';
        else if (streak.count >= 30) newStage = 'TEEN';
        else if (streak.count >= 10) newStage = 'BABY';

        if (newStage !== pet.stage) {
          await prisma.pet.update({
            where: { id: pet.id },
            data: { stage: newStage }
          });

          // Create achievement if milestone reached
          const milestones = {
            ADULT: 'STREAK_100_DAYS',
            TEEN: 'STREAK_30_DAYS',
            BABY: 'STREAK_10_DAYS'
          };

          if (milestones[newStage]) {
            await prisma.petAchievement.create({
              data: {
                type: milestones[newStage],
                petId: pet.id
              }
            });
          }
        }
      }

      return res.status(200).json({
        message: "All daily quests completed! Streak increased!",
        streak: streak.count,
        completed: true
      });
    }

    res.status(200).json({
      message: "Quest completed successfully!",
      completed: false,
      remainingQuests: 3 - completedQuests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDailyQuests, completeQuest };