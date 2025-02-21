const prisma = require('../config/database');

// Pet creation after user registration
const createPet = async (req, res) => {
  try {
    const { userId } = req.body;
    const pet = await prisma.pet.create({
      data: {
        userId,
        name: "SolvanaPet",
        stage: "EGG",
        happiness: 50,
        energy: 100,
        level: 1,
        exp: 0,
        expToNextLevel: 20,
        totalExp: 0
      }
    });
    res.status(201).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pet details
const getPet = async (req, res) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { userId: req.user.id },
      include: {
        achievements: true
      }
    });
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update pet name
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

module.exports = { createPet, getPet, updatePetName };