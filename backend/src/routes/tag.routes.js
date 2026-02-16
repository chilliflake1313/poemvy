const express = require('express');
const router = express.Router();
const tagService = require('../services/tag.service');

// Get popular tags
router.get('/popular', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const tags = await tagService.getPopularTags(parseInt(limit));

    res.status(200).json({
      success: true,
      tags
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search tags
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const tags = await tagService.searchTags(q, parseInt(limit));

    res.status(200).json({
      success: true,
      tags
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
