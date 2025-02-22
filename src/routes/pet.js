const router = require('express').Router();
const { createPet, getPet, updatePetName, getPetStatus } = require('../controllers/PetController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createPet);
router.get('/', auth, getPet);  
router.put('/name', auth, updatePetName);
router.get('/status', auth, getPetStatus);

module.exports = router;