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

// ============================================================================
// ROUTE ORDERING RULES (CRITICAL - DO NOT REORDER)
// ============================================================================
// Express matches routes TOP TO BOTTOM. Order matters!
// 
// ✅ CORRECT ORDER:
//    1. Static routes        (e.g., /feed, /draft)
//    2. Specific paths       (e.g., /tag/:tag)
//    3. Parameter routes     (e.g., /:poemId)
//    4. Nested parameters    (e.g., /:poemId/publish)
//
// ❌ WRONG: Putting /:poemId before /draft causes "draft" to be treated as an ID
//    Result: "Cast to ObjectId failed for value 'draft'" error
// ============================================================================

// Public routes (with optional auth)
router.get('/feed', optionalAuth, poemController.getFeed);
router.get('/user/:username', optionalAuth, poemController.getUserPoems);
router.get('/tag/:tag', optionalAuth, poemController.getPoemsByTag);

// Draft routes (must come BEFORE /:poemId routes to avoid conflicts)
router.put('/draft', protect, poemController.saveDraft);
router.get('/draft', protect, poemController.getDraft);

// Debug: Log when draft route is registered
console.log('[ROUTES] ✅ Draft routes registered: PUT /api/poems/draft (protect only)');
console.log('[ROUTES] ✅ Publish route registered: PUT /api/poems/:poemId/publish (protect + requireEmailVerified)');

// Specific poem routes (after draft routes)
router.get('/:poemId', optionalAuth, poemController.getPoem);

// Protected routes
router.post('/', protect, requireEmailVerified, poemValidation, poemController.createPoem);
router.put('/:poemId', protect, poemValidation, poemController.updatePoem);
router.delete('/:poemId', protect, poemController.deletePoem);
router.put('/:poemId/publish', protect, requireEmailVerified, poemController.publishDraft);
router.post('/:poemId/like', protect, poemController.likePoem);
router.post('/:poemId/unlike', protect, poemController.unlikePoem);
router.post('/:poemId/comment', protect, commentValidation, poemController.addComment);
router.delete('/:poemId/comment/:commentId', protect, poemController.deleteComment);
router.post('/:poemId/share', protect, poemController.sharePoem);

module.exports = router;
