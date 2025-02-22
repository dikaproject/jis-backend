const prisma = require('../../config/database');

const createQuest = async (req, res) => {
  try {
    const { type, title, description, duration, url } = req.body;

    if (!type || !title || !description || !duration) {
      return res.status(400).json({
        message: "All fields are required: type, title, description, duration"
      });
    }

    // Validate URL for MUSIC and VIDEO types
    if ((type === 'MUSIC' || type === 'VIDEO') && !url) {
      return res.status(400).json({
        message: `URL is required for ${type} type quests`
      });
    }

    if (!['BREATHING', 'MUSIC', 'VIDEO'].includes(type)) {
      return res.status(400).json({
        message: "Type must be one of: BREATHING, MUSIC, VIDEO"
      });
    }

    const quest = await prisma.questTemplate.create({
      data: {
        type,
        title,
        description,
        duration,
        url: url || null, // URL is optional for BREATHING type
        isActive: true
      }
    });
    
    res.status(201).json({
      quest,
      message: "New wellness activity created successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, description, duration, isActive, url } = req.body;

    const existingQuest = await prisma.questTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingQuest) {
      return res.status(404).json({
        message: "Wellness activity not found"
      });
    }

    // Validate URL for MUSIC and VIDEO types if type is being updated
    if (type && (type === 'MUSIC' || type === 'VIDEO') && !url && !existingQuest.url) {
      return res.status(400).json({
        message: `URL is required for ${type} type quests`
      });
    }

    if (type && !['BREATHING', 'MUSIC', 'VIDEO'].includes(type)) {
      return res.status(400).json({
        message: "Type must be one of: BREATHING, MUSIC, VIDEO"
      });
    }

    const quest = await prisma.questTemplate.update({
      where: { id: parseInt(id) },
      data: {
        type: type || undefined,
        title: title || undefined,
        description: description || undefined,
        duration: duration || undefined,
        url: url || undefined,
        isActive: isActive === undefined ? undefined : isActive
      }
    });
    
    res.status(200).json({
      quest,
      message: "Wellness activity updated successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllQuests = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    
    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const quests = await prisma.questTemplate.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({
      quests,
      total: quests.length,
      message: "Wellness activities retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteQuest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingQuest = await prisma.questTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingQuest) {
      return res.status(404).json({
        message: "Wellness activity not found"
      });
    }

    await prisma.questTemplate.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
    
    res.status(200).json({
      message: "Wellness activity archived successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQuestById = async (req, res) => {
  try {
    const { id } = req.params;

    const quest = await prisma.questTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!quest) {
      return res.status(404).json({
        message: "Wellness activity not found"
      });
    }

    res.status(200).json({
      quest,
      message: "Wellness activity retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuest,
  getAllQuests,
  updateQuest,
  deleteQuest,
  getQuestById
};