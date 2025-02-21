const prisma = require('../config/database');

const Pet = async (req, res) => {
  try {
    
    res.status(200).json({ message: 'Pet controller berfungsi dengan baik' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { Pet };
