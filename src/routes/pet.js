const router = require('express').Router();
const { Pet } = require('../controllers/PetController');

router.get('/', Pet);

module.exports = router;
