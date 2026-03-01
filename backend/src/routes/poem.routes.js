const express = require('express');
const router = express.Router();
const poemController = require('../controllers/poem.controller');

// POST /api/poems - Create and publish a poem
router.post('/', poemController.createPoem);

// GET /api/poems - Get all published poems (sorted by newest first)
router.get('/', poemController.getPoems);

module.exports = router;
