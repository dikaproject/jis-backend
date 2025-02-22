const prisma = require('../config/database');

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
        userId: req.user.id
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
        petachievements: true
      }
    });

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    const streak = await prisma.streak.findUnique({
      where: { userId: req.user.id }
    });

    const currentStreak = streak?.count || 0;
    const nextThreshold = currentStreak < 10 ? 10 : 
                         currentStreak < 30 ? 30 :
                         currentStreak < 100 ? 100 : null;

    res.status(200).json({
      id: pet.id,
      name: pet.name,
      stage: pet.stage,
      currentStreak,
      nextEvolution: nextThreshold ? {
        threshold: nextThreshold,
        daysLeft: nextThreshold - currentStreak,
        progress: Math.floor((currentStreak / nextThreshold) * 100)
      } : null,
      achievements: pet.petachievements.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePetName = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const pet = await prisma.pet.update({
      where: { userId: req.user.id },
      data: { name }
    });

    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPetStatus = async (req, res) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { userId: req.user.id }
    });

    const streak = await prisma.streak.findUnique({
      where: { userId: req.user.id }
    });

    res.status(200).json({
      pet,
      streak: streak?.count || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPet, getPet, updatePetName, getPetStatus };