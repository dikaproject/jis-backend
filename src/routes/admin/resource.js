const router = require('express').Router();
const { 
  createResource, 
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource
} = require('../../controllers/admin/ResourceController');
const { auth, adminOnly } = require('../../middleware/auth');
const upload = require('../../config/multer');

router.post('/', auth, adminOnly, upload.single('file'), createResource);
router.get('/', auth, adminOnly, getAllResources);
router.get('/:id', auth, adminOnly, getResourceById);
router.put('/:id', auth, adminOnly, upload.single('file'), updateResource);
router.delete('/:id', auth, adminOnly, deleteResource);

module.exports = router;