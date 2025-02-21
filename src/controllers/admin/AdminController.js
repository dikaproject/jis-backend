const prisma = require('../../config/database');

// Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await prisma.$transaction([
      // User Stats
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: today }
        }
      }),

      // Mood Stats
      prisma.mood.groupBy({
        by: ['type'],
        _count: true,
        where: {
          createdAt: { gte: today }
        }
      }),

      // Quest Completion Stats
      prisma.dailyQuest.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: today }
        }
      }),

      // Active Streaks
      prisma.streak.count({
        where: {
          count: { gt: 0 }
        }
      })
    ]);

    res.status(200).json({
      users: {
        total: stats[0],
        newToday: stats[1]
      },
      moods: {
        distribution: stats[2],
        total: stats[2].reduce((acc, curr) => acc + curr._count, 0)
      },
      quests: {
        completedToday: stats[3]
      },
      streaks: {
        active: stats[4]
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    } : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          pet: {
            include: {
              achievements: true
            }
          },
          streaks: {
            orderBy: { count: 'desc' },
            take: 1
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Detailed User Analysis
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        profile: true,
        pet: {
          include: {
            achievements: true
          }
        },
        moods: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            diary: true
          }
        },
        streaks: true,
        questionnaire: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get mood statistics
    const moodStats = await prisma.mood.groupBy({
      by: ['type'],
      where: { userId: parseInt(id) },
      _count: true
    });

    // Get quest completion rate
    const questStats = await prisma.$transaction([
      prisma.dailyQuest.count({
        where: {
          userId: parseInt(id),
          status: 'COMPLETED'
        }
      }),
      prisma.dailyQuest.count({
        where: { userId: parseInt(id) }
      })
    ]);

    res.status(200).json({
      user,
      analysis: {
        moodDistribution: moodStats,
        questCompletionRate: questStats[1] > 0 ? 
          Math.round((questStats[0] / questStats[1]) * 100) : 0,
        currentStreak: user.streaks[0]?.count || 0,
        maxStreak: user.streaks[0]?.maxCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mental Health Monitoring
const getMentalHealthStats = async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Get users with concerning mood patterns
      prisma.user.findMany({
        where: {
          moods: {
            some: {
              type: 'SAD',
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            }
          }
        },
        include: {
          profile: true,
          moods: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }),

      // Overall mood distribution
      prisma.mood.groupBy({
        by: ['type'],
        _count: true
      })
    ]);

    res.status(200).json({
      usersNeedingAttention: stats[0],
      overallMoodDistribution: stats[1]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  getMentalHealthStats
};