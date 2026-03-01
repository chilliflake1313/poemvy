const express = require('express');
const router = express.Router();
const poemController = require('../controllers/poem.controller');
const { protect } = require('../middleware/auth');

// POST /api/poems - Create and publish a poem
router.post('/', poemController.createPoem);

// GET /api/poems - Get all published poems (sorted by newest first)
router.get('/', poemController.getPoems);

// DELETE /api/poems/:poemId - Delete a poem (requires auth)
router.delete('/:poemId', protect, poemController.deletePoem);

module.exports = router;
