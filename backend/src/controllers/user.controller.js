const { validationResult } = require('express-validator');
const userService = require('../services/user.service');

// Get user profile by username
exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await userService.getProfileByUsername(username);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = await userService.searchUsers(q, parseInt(limit));

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const user = await userService.updateProfile(req.user._id, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    await userService.updatePassword(req.user._id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update username
exports.updateUsername = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;

    const user = await userService.updateUsername(req.user._id, username);

    res.status(200).json({
      success: true,
      message: 'Username updated successfully',
      user
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Follow user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await userService.followUser(req.user._id, userId);

    res.status(200).json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Unfollow user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await userService.unfollowUser(req.user._id, userId);

    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    await userService.deleteAccount(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
