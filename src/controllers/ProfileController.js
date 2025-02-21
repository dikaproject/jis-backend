const prisma = require('../config/database');

const updateProfile = async (req, res) => {
  try {
    const { bio, age, gender } = req.body;
    const userId = req.user.id;

    const profile = await prisma.profile.upsert({
      where: {
        userId: userId
      },
      update: {
        bio,
        age,
        gender
      },
      create: {
        userId,
        bio,
        age,
        gender
      }
    });

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profile = await prisma.profile.upsert({
      where: {
        userId: req.user.id
      },
      update: {
        avatar: `/uploads/avatars/${file.filename}`
      },
      create: {
        userId: req.user.id,
        avatar: `/uploads/avatars/${file.filename}`
      }
    });

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateProfile, updateAvatar };