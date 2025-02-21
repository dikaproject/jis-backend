const prisma = require('../../config/database');

const createQuest = async (req, res) => {
  try {
    const { type, title, description, duration } = req.body;
    
    const quest = await prisma.questTemplate.create({
      data: {
        type,
        title,
        description,
        duration,
        isActive: true
      }
    });
    
    res.status(201).json(quest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllQuests = async (req, res) => {
  try {
    const quests = await prisma.questTemplate.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json(quests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const {  type, title, description, duration } = req.body;
    
    const quest = await prisma.questTemplate.update({
      where: { id: parseInt(id) },
      data: {
        type,
        title,
        description,
        duration,
        isActive: true
      }
    });
    
    res.status(200).json(quest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteQuest = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.questTemplate.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuest,
  getAllQuests,
  updateQuest,
  deleteQuest
};