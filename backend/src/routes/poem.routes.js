const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const poemController = require('../controllers/poem.controller');
const { protect, optionalAuth, requireEmailVerified } = require('../middleware/auth');

// Validation middleware
const poemValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Poem content is required')
    .isLength({ max: 10000 })
    .withMessage('Poem content cannot exceed 10000 characters'),
  body('tagNames')
    .optional()
    .isArray()
    .withMessage('tagNames must be an array'),
  body('tagNames.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tag name cannot exceed 30 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('collectionId')
    .optional()
    .isMongoId()
    .withMessage('collectionId must be a valid MongoDB ID'),
];

const commentValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters')
];

// Public routes (with optional auth)
router.get('/feed', optionalAuth, poemController.getFeed);
router.get('/:poemId', optionalAuth, poemController.getPoem);
router.get('/user/:username', optionalAuth, poemController.getUserPoems);
router.get('/tag/:tag', optionalAuth, poemController.getPoemsByTag);

// Protected routes
router.post('/', protect, requireEmailVerified, poemValidation, poemController.createPoem);
router.put('/:poemId', protect, poemValidation, poemController.updatePoem);
router.delete('/:poemId', protect, poemController.deletePoem);
router.post('/:poemId/like', protect, poemController.likePoem);
router.post('/:poemId/unlike', protect, poemController.unlikePoem);
router.post('/:poemId/comment', protect, commentValidation, poemController.addComment);
router.delete('/:poemId/comment/:commentId', protect, poemController.deleteComment);
router.post('/:poemId/share', protect, poemController.sharePoem);


module.exports = router;
