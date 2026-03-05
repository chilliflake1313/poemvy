const express = require('express');
const router = express.Router();
const poemController = require('../controllers/poem.controller');
const { protect } = require('../middleware/auth');

// POST /api/poems - Create and publish a poem
router.post('/', poemController.createPoem);

// GET /api/poems - Get all published poems (sorted by newest first)
router.get('/', poemController.getPoems);

// POST /api/poems/:poemId/like - Like a poem
router.post('/:poemId/like', poemController.likePoem);

// POST /api/poems/:poemId/unlike - Unlike a poem
router.post('/:poemId/unlike', poemController.unlikePoem);

// DELETE /api/poems/:poemId - Delete a poem (requires auth)
router.delete('/:poemId', protect, poemController.deletePoem);

module.exports = router;
