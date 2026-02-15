const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const collectionController = require('../controllers/collection.controller');
const { protect, optionalAuth } = require('../middleware/auth');

// Validation middleware
const collectionValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Collection name is required')
    .isLength({ max: 100 })
    .withMessage('Collection name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Public routes (with optional auth)
router.get('/:collectionId', optionalAuth, collectionController.getCollection);
router.get('/user/:username', optionalAuth, collectionController.getUserCollections);

// Protected routes
router.post('/', protect, collectionValidation, collectionController.createCollection);
router.put('/:collectionId', protect, collectionValidation, collectionController.updateCollection);
router.delete('/:collectionId', protect, collectionController.deleteCollection);
router.post('/:collectionId/poems/:poemId', protect, collectionController.addPoem);
router.delete('/:collectionId/poems/:poemId', protect, collectionController.removePoem);
router.post('/:collectionId/follow', protect, collectionController.followCollection);
router.post('/:collectionId/unfollow', protect, collectionController.unfollowCollection);

module.exports = router;
