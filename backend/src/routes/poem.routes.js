const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const poemController = require('../controllers/poem.controller');
const { protect, optionalAuth } = require('../middleware/auth');

// Validation middleware
const poemValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Poem body is required')
    .isLength({ max: 10000 })
    .withMessage('Poem body cannot exceed 10000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isDraft')
    .optional()
    .isBoolean()
    .withMessage('isDraft must be a boolean')
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
router.post('/', protect, poemValidation, poemController.createPoem);
router.put('/:poemId', protect, poemValidation, poemController.updatePoem);
router.delete('/:poemId', protect, poemController.deletePoem);
router.post('/:poemId/like', protect, poemController.likePoem);
router.post('/:poemId/unlike', protect, poemController.unlikePoem);
router.post('/:poemId/comment', protect, commentValidation, poemController.addComment);
router.delete('/:poemId/comment/:commentId', protect, poemController.deleteComment);
router.post('/:poemId/share', protect, poemController.sharePoem);

module.exports = router;
