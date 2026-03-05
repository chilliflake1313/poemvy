const Poem = require('../models/Poem');
const mongoose = require('mongoose');

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Create and publish a new poem
exports.createPoem = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const poemData = {
      title,
      content,
      tags,
      author: req.user?._id
    };

    const poem = await Poem.create(poemData);
    const populatedPoem = await poem.populate('author', 'username bio avatar');
    res.status(201).json(populatedPoem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all published poems (sorted by newest first)
exports.getPoems = async (req, res) => {
  try {
    const { q } = req.query;
    const searchQuery = typeof q === 'string' ? q.trim() : '';

    const queryFilter = {};

    if (searchQuery) {
      if (searchQuery.startsWith('#')) {
        const normalizedTag = searchQuery
          .replace(/^#+/, '')
          .toLowerCase()
          .trim();

        if (normalizedTag) {
          queryFilter.tags = normalizedTag;
        }
      } else {
        queryFilter.content = { $regex: escapeRegex(searchQuery), $options: 'i' };
      }
    }

    const poems = await Poem.find(queryFilter)
      .populate('author', 'username bio avatar')
      .populate('likes', '_id')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(poems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function resolveUserId(req) {
  const userIdFromAuth = req.user?._id;
  const userIdFromBody = req.body?.userId;
  const userIdFromHeader = req.headers['x-user-id'];

  return userIdFromAuth || userIdFromBody || userIdFromHeader;
}

// Like a poem
exports.likePoem = async (req, res) => {
  try {
    const { poemId } = req.params;
    const userId = resolveUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Valid user ID is required to like a poem' });
    }

    const poem = await Poem.findByIdAndUpdate(
      poemId,
      { $addToSet: { likes: userId } },
      { new: true }
    );

    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }

    res.status(200).json({
      success: true,
      poemId: poem._id,
      liked: true,
      likesCount: poem.likes.length
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Unlike a poem
exports.unlikePoem = async (req, res) => {
  try {
    const { poemId } = req.params;
    const userId = resolveUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Valid user ID is required to unlike a poem' });
    }

    const poem = await Poem.findByIdAndUpdate(
      poemId,
      { $pull: { likes: userId } },
      { new: true }
    );

    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }

    res.status(200).json({
      success: true,
      poemId: poem._id,
      liked: false,
      likesCount: poem.likes.length
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a poem
exports.deletePoem = async (req, res) => {
  try {
    const { poemId } = req.params;
    
    const poem = await Poem.findById(poemId);
    
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }

    // Check if user is the poem author (if auth is enabled)
    // For development, allow deletion without auth check
    if (req.user && poem.author && poem.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own poems' });
    }

    await Poem.findByIdAndDelete(poemId);
    res.json({ success: true, message: 'Poem deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
