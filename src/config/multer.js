const multer = require('multer');
const path = require('path');
const fs = require('fs');


const createUploadDirs = () => {
  const dirs = ['uploads/music', 'uploads/video', 'uploads/thumbnails'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type?.toLowerCase() || 'other';
    cb(null, `uploads/${type}/`);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
  }
});


const fileFilter = (req, file, cb) => {
  const type = req.body.type?.toUpperCase();
  
  switch (type) {
    case 'MUSIC':
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Please upload an audio file.'), false);
      }
      break;
      
    case 'VIDEO':
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Please upload a video file.'), false);
      }
      break;
      
    default:
      cb(new Error('Invalid resource type.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 
  }
});

module.exports = upload;