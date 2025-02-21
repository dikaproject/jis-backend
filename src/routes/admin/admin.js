const router = require('express').Router();
const { 
  getDashboardStats, 
  getAllUsers, 
  getUserDetails,
  getMentalHealthStats
} = require('../../controllers/admin/AdminController');
const { auth, adminOnly } = require('../../middleware/auth');

router.get('/dashboard', auth, adminOnly, getDashboardStats);
router.get('/users', auth, adminOnly, getAllUsers);
router.get('/users/:id', auth, adminOnly, getUserDetails);
router.get('/mental-health', auth, adminOnly, getMentalHealthStats);

module.exports = router;