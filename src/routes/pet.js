const router = require('express').Router();
const { createPet, getPet, updatePetName } = require('../controllers/PetController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createPet);
router.get('/', auth, getPet);  // Changed from '/my-pet' to '/'
router.patch('/name', auth, updatePetName);

module.exports = router;