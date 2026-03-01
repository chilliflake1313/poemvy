const express = require('express');
const router = express.Router();
const poemController = require('../controllers/poem.controller');
const { protect } = require('../middleware/auth');

// Routes
router.post('/', protect, poemController.createPoem);
router.get('/', poemController.getPoems);

module.exports = router;
