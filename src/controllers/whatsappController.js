const prisma = require('../config/database');
const axios = require('axios');

const FONNTE_API_KEY = process.env.FONNTE_API_KEY;

// Send WhatsApp message using Fonnte
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const response = await axios.post('https://api.fonnte.com/send', {
      target: phoneNumber,
      message
    }, {
      headers: {
        'Authorization': FONNTE_API_KEY
      }
    });

    await prisma.whatsappLog.create({
      data: {
        phoneNumber,
        messageType: 'reminder',
        content: message,
        status: response.data.status === 'success' ? 'sent' : 'failed'
      }
    });

    return response.data;
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return null;
  }
};

// Generate personalized message based on user's mood history
const generatePersonalizedMessage = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      moods: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!user.moods.length) {
    return {
      morning: `Hi ${user.name}! 🌅 Start your day by tracking your mood and writing in your diary. Remember, taking care of your mental health is important!`,
      evening: `Hey ${user.name}! 🌙 Don't forget to reflect on your day. How are you feeling? Take a moment to record your mood and thoughts.`
    };
  }

  const lastMood = user.moods[0];
  const moodCounts = user.moods.reduce((acc, mood) => {
    acc[mood.type] = (acc[mood.type] || 0) + 1;
    return acc;
  }, {});

  const predominantMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)[0][0];

  const messages = {
    HAPPY: {
      morning: `Good morning ${user.name}! 🌟 Your positive energy has been inspiring. Keep tracking your happiness journey!`,
      evening: `Hi ${user.name}! 🌙 You've been in great spirits lately. Share your day's highlights in your diary!`
    },
    NEUTRAL: {
      morning: `Hello ${user.name}! 🌅 Balance is key. Start your day with a mood check-in.`,
      evening: `Evening, ${user.name}! 📝 How did your day go? Take a moment to reflect and record your thoughts.`
    },
    SAD: {
      morning: `Good morning ${user.name}! 🌅 Remember, you're not alone. Start your day by sharing how you feel.`,
      evening: `Hi ${user.name}! 🤗 Your feelings matter. Take a moment to express yourself in your diary.`
    },
    ANGRY: {
      morning: `Morning ${user.name}! 🌅 Each day is a fresh start. Begin with a mood check-in.`,
      evening: `Hey ${user.name}! 😌 Release any tension from today by writing in your diary.`
    }
  };

  return messages[predominantMood];
};

// Send morning reminder
const sendMorningReminder = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        whatsappNumber: { not: null }
      }
    });

    for (const user of users) {
      const messages = await generatePersonalizedMessage(user.id);
      await sendWhatsAppMessage(user.whatsappNumber, messages.morning);
    }

    res.status(200).json({ message: "Morning reminders sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send evening reminder
const sendEveningReminder = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        whatsappNumber: { not: null }
      }
    });

    for (const user of users) {
      const messages = await generatePersonalizedMessage(user.id);
      await sendWhatsAppMessage(user.whatsappNumber, messages.evening);
    }

    res.status(200).json({ message: "Evening reminders sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMorningReminder,
  sendEveningReminder
};