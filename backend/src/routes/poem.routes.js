const express = require('express');
const router = express.Router();
const poemController = require('../controllers/poem.controller');
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');

// POST /api/poems - Create and publish a poem
router.post('/', poemController.createPoem);

// GET /api/poems - Get all published poems (sorted by newest first)
router.get('/', poemController.getPoems);

// GET /api/poems/user/:username - Get all poems by a specific user
router.get('/user/:username', poemController.getPoemsByUsername);

// POST /api/poems/:poemId/like - Like a poem
router.post('/:poemId/like', poemController.likePoem);

// POST /api/poems/:poemId/unlike - Unlike a poem
router.post('/:poemId/unlike', poemController.unlikePoem);

// POST /api/poems/:poemId/comments - Add a comment to a poem
router.post('/:poemId/comments', commentController.addComment);

// GET /api/poems/:poemId/comments - Get all comments for a poem
router.get('/:poemId/comments', commentController.getComments);

// PUT /api/poems/:poemId - Update a poem (requires auth)
router.put('/:poemId', protect, poemController.updatePoem);

// DELETE /api/poems/:poemId - Delete a poem (requires auth)
router.delete('/:poemId', protect, poemController.deletePoem);

module.exports = router;
