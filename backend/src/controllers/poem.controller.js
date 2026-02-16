const { validationResult } = require('express-validator');
const poemService = require('../services/poem.service');

// Get feed of poems
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?._id;

    const result = await poemService.getFeed(parseInt(page), parseInt(limit), userId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single poem
exports.getPoem = async (req, res) => {
  try {
    const { poemId } = req.params;
    const userId = req.user?._id;

    const poem = await poemService.getPoem(poemId, userId);

    res.status(200).json({
      success: true,
      poem
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Get poems by user
exports.getUserPoems = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, drafts = false } = req.query;
    const requesterId = req.user?._id;

    const result = await poemService.getUserPoems(
      username,
      parseInt(page),
      parseInt(limit),
      drafts === 'true',
      requesterId
    );

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get poems by tag
exports.getPoemsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await poemService.getPoemsByTag(tag, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create poem
exports.createPoem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const poemData = { ...req.body, author: req.user._id };

    const poem = await poemService.createPoem(poemData);

    res.status(201).json({
      success: true,
      message: 'Poem created successfully',
      poem
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update poem
exports.updatePoem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { poemId } = req.params;

    const poem = await poemService.updatePoem(poemId, req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Poem updated successfully',
      poem
    });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

// Delete poem
exports.deletePoem = async (req, res) => {
  try {
    const { poemId } = req.params;

    await poemService.deletePoem(poemId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Poem deleted successfully'
    });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

// Like poem
exports.likePoem = async (req, res) => {
  try {
    const { poemId } = req.params;

    await poemService.likePoem(poemId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Poem liked successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Unlike poem
exports.unlikePoem = async (req, res) => {
  try {
    const { poemId } = req.params;

    await poemService.unlikePoem(poemId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Poem unliked successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { poemId } = req.params;
    const { text } = req.body;

    const poem = await poemService.addComment(poemId, req.user._id, text);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      poem
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { poemId, commentId } = req.params;

    await poemService.deleteComment(poemId, commentId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

// Share poem
exports.sharePoem = async (req, res) => {
  try {
    const { poemId } = req.params;

    await poemService.sharePoem(poemId);

    res.status(200).json({
      success: true,
      message: 'Poem shared successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save or update draft
exports.saveDraft = async (req, res) => {
  try {
    console.log('[SAVE DRAFT CONTROLLER] Request received');
    console.log('[SAVE DRAFT] User:', {
      id: req.user._id,
      username: req.user.username,
      isEmailVerified: req.user.isEmailVerified
    });
    console.log('[SAVE DRAFT] Body:', { 
      hasTitle: !!req.body.title, 
      hasContent: !!req.body.content,
      contentLength: req.body.content?.length || 0
    });

    const { title, content } = req.body;
    const userId = req.user._id;

    const draft = await poemService.saveDraft(userId, title, content);
    console.log('[SAVE DRAFT] ✅ Draft saved successfully, ID:', draft._id);

    res.status(200).json({
      success: true,
      message: 'Draft saved successfully',
      draftId: draft._id
    });
  } catch (error) {
    console.error('[SAVE DRAFT] ❌ Error:', error.message);
    console.error('[SAVE DRAFT] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

// Get latest draft
exports.getDraft = async (req, res) => {
  try {
    const userId = req.user._id;

    const draft = await poemService.getDraft(userId);

    if (!draft) {
      return res.status(200).json({
        success: true,
        draft: null
      });
    }

    res.status(200).json({
      success: true,
      draft
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Publish draft
exports.publishDraft = async (req, res) => {
  try {
    const { poemId } = req.params;
    const userId = req.user._id;

    const poem = await poemService.publishDraft(poemId, userId);

    res.status(200).json({
      success: true,
      message: 'Poem published successfully',
      poem
    });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};
