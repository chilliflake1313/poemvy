const { validationResult } = require('express-validator');
const userService = require('../services/user.service');
const Otp = require('../models/Otp');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/mailer');

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

// Request password change - Step 1: Verify current password and send OTP
exports.requestPasswordChange = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing password-change OTPs for this user
    await Otp.deleteMany({
      email: user.email,
      type: 'password-change'
    });

    // Create new OTP
    await Otp.create({
      email: user.email,
      code,
      type: 'password-change',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // Send OTP email
    await sendOTPEmail(user.email, code);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('Request password change error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify password change - Step 2: Verify OTP and update password
exports.verifyPasswordChange = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find OTP
    const otp = await Otp.findOne({
      email: user.email,
      code,
      type: 'password-change'
    });

    if (!otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (otp.expiresAt < new Date()) {
      await otp.deleteOne();
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.refreshTokens = []; // Clear all sessions

    await user.save();
    await otp.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Verify password change error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update password (old method - keeping for backwards compatibility)
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

// Request email update - send OTP to new email
exports.requestEmailUpdate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newEmail } = req.body;

    await userService.requestEmailUpdate(req.user._id, currentPassword, newEmail);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your new email address'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Verify email update
exports.verifyEmailUpdate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newEmail, code } = req.body;

    const user = await userService.verifyEmailUpdate(req.user._id, newEmail, code);

    res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    await userService.deleteAccount(req.user._id, password);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Bookmark poem
exports.bookmarkPoem = async (req, res) => {
  try {
    const { poemId } = req.params;

    await userService.bookmarkPoem(req.user._id, poemId);

    res.status(200).json({
      success: true,
      message: 'Poem bookmarked successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Unbookmark poem
exports.unbookmarkPoem = async (req, res) => {
  try {
    const { poemId } = req.params;

    await userService.unbookmarkPoem(req.user._id, poemId);

    res.status(200).json({
      success: true,
      message: 'Poem unbookmarked successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get bookmarked poems
exports.getBookmarkedPoems = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await userService.getBookmarkedPoems(req.user._id, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get liked poems
exports.getLikedPoems = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await userService.getLikedPoems(req.user._id, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
