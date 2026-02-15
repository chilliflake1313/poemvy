const Tag = require('../models/Tag');

// Find or create tag by name
exports.findOrCreateTag = async (tagName) => {
  try {
    const normalizedName = tagName.toLowerCase().trim();

    if (!normalizedName || normalizedName.length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    if (normalizedName.length > 30) {
      throw new Error('Tag name cannot exceed 30 characters');
    }

    // Check if tag exists
    let tag = await Tag.findOne({ name: normalizedName });

    if (tag) {
      // Increment usage count
      tag.usageCount += 1;
      await tag.save();
    } else {
      // Create new tag
      tag = await Tag.create({ name: normalizedName });
      tag.usageCount = 1;
      await tag.save();
    }

    return tag;
  } catch (error) {
    throw error;
  }
};

// Process array of tag names and return tag IDs
exports.processTagNames = async (tagNames) => {
  try {
    if (!Array.isArray(tagNames)) {
      return [];
    }

    // Limit to 10 tags per poem
    const limitedTags = tagNames.slice(0, 10);

    const tagPromises = limitedTags.map(name => this.findOrCreateTag(name));
    const tags = await Promise.all(tagPromises);

    return tags.map(tag => tag._id);
  } catch (error) {
    throw error;
  }
};

// Get popular tags
exports.getPopularTags = async (limit = 20) => {
  try {
    const tags = await Tag.find()
      .sort({ usageCount: -1 })
      .limit(limit)
      .select('name slug usageCount');

    return tags;
  } catch (error) {
    throw error;
  }
};

// Search tags by name
exports.searchTags = async (query, limit = 10) => {
  try {
    const tags = await Tag.find({
      name: { $regex: query, $options: 'i' }
    })
      .sort({ usageCount: -1 })
      .limit(limit)
      .select('name slug usageCount');

    return tags;
  } catch (error) {
    throw error;
  }
};

// Decrement tag usage count (when poem is deleted)
exports.decrementTagUsage = async (tagIds) => {
  try {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return;
    }

    await Tag.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { usageCount: -1 } }
    );

    // Optionally delete tags with 0 usage
    await Tag.deleteMany({ usageCount: { $lte: 0 } });
  } catch (error) {
    throw error;
  }
};

module.exports = exports;
