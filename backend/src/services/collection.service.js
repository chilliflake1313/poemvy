const Collection = require('../models/Collection');
const User = require('../models/User');
const Poem = require('../models/Poem');

// Get collection by ID
exports.getCollection = async (collectionId, userId = null) => {
  try {
    const collection = await Collection.findById(collectionId)
      .populate('owner', 'username name avatar')
      .populate({
        path: 'poems',
        populate: { path: 'author', select: 'username name avatar' }
      });

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check if user can view this collection
    if (!collection.isPublic) {
      if (!userId || collection.owner._id.toString() !== userId.toString()) {
        throw new Error('Collection not found');
      }
    }

    return collection;
  } catch (error) {
    throw error;
  }
};

// Get user's collections
exports.getUserCollections = async (username, userId = null) => {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error('User not found');
    }

    const query = { owner: user._id };

    // Only show public collections unless viewing own profile
    if (!userId || user._id.toString() !== userId.toString()) {
      query.isPublic = true;
    }

    const collections = await Collection.find(query)
      .sort({ createdAt: -1 })
      .populate('poems', 'title');

    return collections;
  } catch (error) {
    throw error;
  }
};

// Create collection
exports.createCollection = async (collectionData) => {
  try {
    const collection = await Collection.create(collectionData);

    return collection.populate('owner', 'username name avatar');
  } catch (error) {
    throw error;
  }
};

// Update collection
exports.updateCollection = async (collectionId, userId, updates) => {
  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check ownership
    if (collection.owner.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this collection');
    }

    // Update fields
    const allowedUpdates = ['name', 'description', 'isPublic'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        collection[key] = updates[key];
      }
    });

    await collection.save();

    return collection.populate('owner', 'username name avatar');
  } catch (error) {
    throw error;
  }
};

// Delete collection
exports.deleteCollection = async (collectionId, userId) => {
  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check ownership
    if (collection.owner.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this collection');
    }

    await collection.deleteOne();

    return true;
  } catch (error) {
    throw error;
  }
};

// Add poem to collection
exports.addPoem = async (collectionId, poemId, userId) => {
  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check ownership
    if (collection.owner.toString() !== userId.toString()) {
      throw new Error('Not authorized to modify this collection');
    }

    // Check if poem exists
    const poem = await Poem.findById(poemId);

    if (!poem) {
      throw new Error('Poem not found');
    }

    // Check if poem already in collection
    if (collection.poems.includes(poemId)) {
      throw new Error('Poem already in collection');
    }

    collection.poems.push(poemId);
    await collection.save();

    // Update poem's collection reference
    poem.collection = collectionId;
    await poem.save();

    return collection;
  } catch (error) {
    throw error;
  }
};

// Remove poem from collection
exports.removePoem = async (collectionId, poemId, userId) => {
  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check ownership
    if (collection.owner.toString() !== userId.toString()) {
      throw new Error('Not authorized to modify this collection');
    }

    collection.poems = collection.poems.filter(id => id.toString() !== poemId);
    await collection.save();

    // Remove collection reference from poem
    await Poem.findByIdAndUpdate(poemId, { collection: null });

    return collection;
  } catch (error) {
    throw error;
  }
};

// Follow collection
exports.followCollection = async (collectionId, userId) => {
  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check if already following
    if (collection.followers.includes(userId)) {
      throw new Error('Already following this collection');
    }

    collection.followers.push(userId);
    await collection.save();

    return true;
  } catch (error) {
    throw error;
  }
};

// Unfollow collection
exports.unfollowCollection = async (collectionId, userId) => {
  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      throw new Error('Collection not found');
    }

    collection.followers = collection.followers.filter(id => id.toString() !== userId.toString());
    await collection.save();

    return true;
  } catch (error) {
    throw error;
  }
};
