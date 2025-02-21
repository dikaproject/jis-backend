const prisma = require('../config/database');

const getStageFromStreak = (streakCount) => {
  if (streakCount >= 100) return 'ADULT';
  if (streakCount >= 30) return 'TEEN';
  if (streakCount >= 10) return 'BABY';
  return 'EGG';
};

const createPet = async (req, res) => {
  try {
    const existingPet = await prisma.pet.findUnique({
      where: { userId: req.user.id }
    });

    if (existingPet) {
      return res.status(400).json({ message: 'User already has a pet' });
    }

    const pet = await prisma.pet.create({
      data: {
        userId: req.user.id,
        name: "SolvanaPet",
        stage: "EGG"
      }
    });

    res.status(201).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPet = async (req, res) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { userId: req.user.id },
      include: {
        achievements: true,
        user: {
          include: {
            streaks: {
              orderBy: { count: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    const currentStreak = pet.user.streaks[0]?.count || 0;
    const newStage = getStageFromStreak(currentStreak);

    // Update stage if changed
    if (newStage !== pet.stage) {
      await prisma.pet.update({
        where: { id: pet.id },
        data: { stage: newStage }
      });
    }

    // Get next evolution threshold
    const nextThreshold = currentStreak < 10 ? 10 : 
                         currentStreak < 30 ? 30 :
                         currentStreak < 100 ? 100 : null;

    res.status(200).json({
      id: pet.id,
      name: pet.name,
      stage: newStage,
      currentStreak,
      nextEvolution: nextThreshold ? {
        threshold: nextThreshold,
        daysLeft: nextThreshold - currentStreak,
        progress: Math.floor((currentStreak / nextThreshold) * 100)
      } : null,
      achievements: pet.achievements.length,
      motivationalMessage: getMotivationalMessage(currentStreak, newStage)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMotivationalMessage = (streak, stage) => {
  if (streak === 0) return "Start your wellness journey today!";
  
  const messages = {
    EGG: "Keep going! Your pet will evolve soon!",
    BABY: "Growing stronger each day!",
    TEEN: "Amazing progress! Stay consistent!",
    ADULT: "Incredible dedication to your well-being!"
  };
  
  return `Day ${streak}: ${messages[stage]}`;
};

const updatePetName = async (req, res) => {
  try {
    const { name } = req.body;
    const pet = await prisma.pet.update({
      where: { userId: req.user.id },
      data: { name }
    });
    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPet, updatePetName, createPet };