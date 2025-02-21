const router = require('express').Router();
const { updateProfile, updateAvatar } = require('../controllers/ProfileController');
const { auth } = require('../middleware/auth');
const upload = require('../config/multer');

router.put('/', auth, updateProfile);
router.put('/avatar', auth, upload.single('avatar'), updateAvatar);

module.exports = router;