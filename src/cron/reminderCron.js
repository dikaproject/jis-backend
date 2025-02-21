const cron = require('node-cron');
const { sendMorningReminder, sendEveningReminder } = require('../controllers/whatsappController');

// Schedule morning reminder at 8 AM
cron.schedule('0 8 * * *', async () => {
  try {
    await sendMorningReminder();
    console.log('Morning reminders sent successfully');
  } catch (error) {
    console.error('Error sending morning reminders:', error);
  }
});

// Schedule evening reminder at 8 PM
cron.schedule('0 20 * * *', async () => {
  try {
    await sendEveningReminder();
    console.log('Evening reminders sent successfully');
  } catch (error) {
    console.error('Error sending evening reminders:', error);
  }
});