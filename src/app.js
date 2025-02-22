const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const imageaiRoutes = require('./routes/imageai')
const petRoutes = require('./routes/pet');
const questRoutes = require('./routes/quest');
const adminQuestRoutes = require('./routes/admin/quest');
const adminResourceRoutes = require('./routes/admin/resource');
const profileRoutes = require('./routes/profile');
const questionnaireRoutes = require('./routes/questionnaire');
const achievementRoutes = require('./routes/achievement');
const moodRoutes = require('./routes/mood');
const diaryRoutes = require('./routes/diary');
const adminRoutes = require('./routes/admin/admin');
const whatsappRoutes = require('./routes/whatsapp');
const aiRoutes = require('./routes/aichat');
require('./cron/reminderCron');

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads')); 


app.use('/api/auth', authRoutes);
app.use('/api/imageai', imageaiRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/admin/quests', adminQuestRoutes);
app.use('/api/admin/resources', adminResourceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/diaries', diaryRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/ai', aiRoutes);


app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;