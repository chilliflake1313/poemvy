
console.log('POEM ROUTES PATH: - poem.routes.js:2', __filename);
const express = require('express');
const router = express.Router();
const poemController = require('../controllers/poem.controller');
const { protect } = require('../middleware/auth');

// Minimal clean routes
router.post('/', protect, poemController.createPoem);
router.get('/', poemController.getFeed);

module.exports = router;
