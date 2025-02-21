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

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Add this line

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/imageai', imageaiRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/admin/quests', adminQuestRoutes);
app.use('/api/admin/resources', adminResourceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/questionnaire', questionnaireRoutes);

// Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;