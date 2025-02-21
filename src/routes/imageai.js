const express = require('express');
const router = express.Router();
const { analyzeMood } = require('../controllers/imageaiController');
const upload = require('../config/multer');
const { auth } = require('../middleware/auth');


const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

router.post('/analyze-mood', auth, upload.single('image'), analyzeMood);

module.exports = router;