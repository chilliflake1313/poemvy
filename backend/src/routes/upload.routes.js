const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');

// Protected routes - require authentication
router.post(
  '/poem-image',
  protect,
  uploadController.uploadMiddleware.single('image'),
  uploadController.uploadPoemImage
);

router.post(
  '/avatar',
  protect,
  uploadController.uploadMiddleware.single('avatar'),
  uploadController.uploadAvatar
);

module.exports = router;
