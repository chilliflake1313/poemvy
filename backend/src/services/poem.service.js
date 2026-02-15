const Poem = require('../models/Poem');
const User = require('../models/User');

// Get feed of poems
exports.getFeed = async (page = 1, limit = 10, userId = null) => {
  try {
    const skip = (page - 1) * limit;

    const query = { isDraft: false, isPublic: true };

    const poems = await Poem.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .populate('collection', 'name');

    const total = await Poem.countDocuments(query);

    return {
      poems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get single poem
exports.getPoem = async (poemId, userId = null) => {
  try {
    const poem = await Poem.findById(poemId)
      .populate('author', 'username name avatar bio')
      .populate('collection', 'name')
      .populate('comments.user', 'username name avatar');

    if (!poem) {
      throw new Error('Poem not found');
    }

    // Check if user can view this poem
    if (poem.isDraft || !poem.isPublic) {
      if (!userId || poem.author._id.toString() !== userId.toString()) {
        throw new Error('Poem not found');
      }
    }

    // Increment view count
    poem.views += 1;
    await poem.save();

    return poem;
  } catch (error) {
    throw error;
  }
};

// Get poems by user
exports.getUserPoems = async (username, page = 1, limit = 10, drafts = false, requesterId = null) => {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error('User not found');
    }

    const skip = (page - 1) * limit;
    const query = { author: user._id };

    // If requesting drafts, must be the owner
    if (drafts) {
      if (!requesterId || user._id.toString() !== requesterId.toString()) {
        throw new Error('Not authorized to view drafts');
      }
      query.isDraft = true;
    } else {
      query.isDraft = false;
      query.isPublic = true;
    }

    const poems = await Poem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('collection', 'name');

    const total = await Poem.countDocuments(query);

    return {
      poems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get poems by tag
exports.getPoemsByTag = async (tag, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const query = {
      tags: tag.toLowerCase(),
      isDraft: false,
      isPublic: true
    };

    const poems = await Poem.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar');

    const total = await Poem.countDocuments(query);

    return {
      poems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

// Create poem
exports.createPoem = async (poemData) => {
  try {
    const poem = await Poem.create(poemData);

    return poem.populate('author', 'username name avatar');
  } catch (error) {
    throw error;
  }
};

// Update poem
exports.updatePoem = async (poemId, userId, updates) => {
  try {
    const poem = await Poem.findById(poemId);

    if (!poem) {
      throw new Error('Poem not found');
    }

    // Check ownership
    if (poem.author.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this poem');
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== 'author' && key !== '_id') {
        poem[key] = updates[key];
      }
    });

    await poem.save();

    return poem.populate('author', 'username name avatar');
  } catch (error) {
    throw error;
  }
};

// Delete poem
exports.deletePoem = async (poemId, userId) => {
  try {
    const poem = await Poem.findById(poemId);

    if (!poem) {
      throw new Error('Poem not found');
    }

    // Check ownership
    if (poem.author.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this poem');
    }

    await poem.deleteOne();

    return true;
  } catch (error) {
    throw error;
  }
};

// Like poem
exports.likePoem = async (poemId, userId) => {
  try {
    const poem = await Poem.findById(poemId);

    if (!poem) {
      throw new Error('Poem not found');
    }

    // Check if already liked
    if (poem.likes.includes(userId)) {
      throw new Error('Poem already liked');
    }

    poem.likes.push(userId);
    await poem.save();

    return true;
  } catch (error) {
    throw error;
  }
};

// Unlike poem
exports.unlikePoem = async (poemId, userId) => {
  try {
    const poem = await Poem.findById(poemId);

    if (!poem) {
      throw new Error('Poem not found');
    }

    poem.likes = poem.likes.filter(id => id.toString() !== userId.toString());
    await poem.save();

    return true;
  } catch (error) {
    throw error;
  }
};

// Add comment
exports.addComment = async (poemId, userId, text) => {
  try {
    const poem = await Poem.findById(poemId);

    if (!poem) {
      throw new Error('Poem not found');
    }

    poem.comments.push({ user: userId, text });
    await poem.save();

    return poem.populate('comments.user', 'username name avatar');
  } catch (error) {
    throw error;
  }
};

// Delete comment
exports.deleteComment = async (poemId, commentId, userId) => {
  try {
    const poem = await Poem.findById(poemId);

    if (!poem) {
      throw new Error('Poem not found');
    }

    const comment = poem.comments.id(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user owns the comment or the poem
    if (comment.user.toString() !== userId.toString() && poem.author.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this comment');
    }

    comment.deleteOne();
    await poem.save();

    return true;
  } catch (error) {
    throw error;
  }
};

// Share poem (increment share count)
exports.sharePoem = async (poemId) => {
  try {
    const poem = await Poem.findById(poemId);

    if (!poem) {
      throw new Error('Poem not found');
    }

    poem.shares += 1;
    await poem.save();

    return true;
  } catch (error) {
    throw error;
  }
};
