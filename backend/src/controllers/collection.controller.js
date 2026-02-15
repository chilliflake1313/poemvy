const { validationResult } = require('express-validator');
const collectionService = require('../services/collection.service');

// Get collection by ID
exports.getCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const userId = req.user?._id;

    const collection = await collectionService.getCollection(collectionId, userId);

    res.status(200).json({
      success: true,
      collection
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Get user's collections
exports.getUserCollections = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?._id;

    const collections = await collectionService.getUserCollections(username, userId);

    res.status(200).json({
      success: true,
      collections
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create collection
exports.createCollection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const collectionData = { ...req.body, owner: req.user._id };

    const collection = await collectionService.createCollection(collectionData);

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update collection
exports.updateCollection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { collectionId } = req.params;

    const collection = await collectionService.updateCollection(
      collectionId,
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      collection
    });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

// Delete collection
exports.deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    await collectionService.deleteCollection(collectionId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

// Add poem to collection
exports.addPoem = async (req, res) => {
  try {
    const { collectionId, poemId } = req.params;

    const collection = await collectionService.addPoem(collectionId, poemId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Poem added to collection',
      collection
    });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

// Remove poem from collection
exports.removePoem = async (req, res) => {
  try {
    const { collectionId, poemId } = req.params;

    const collection = await collectionService.removePoem(collectionId, poemId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Poem removed from collection',
      collection
    });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

// Follow collection
exports.followCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    await collectionService.followCollection(collectionId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Collection followed successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Unfollow collection
exports.unfollowCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    await collectionService.unfollowCollection(collectionId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Collection unfollowed successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
