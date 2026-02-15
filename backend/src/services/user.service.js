const User = require('../models/User');
const Poem = require('../models/Poem');
const Collection = require('../models/Collection');

// Get user profile by username
exports.getProfileByUsername = async (username) => {
  try {
    const user = await User.findOne({ username })
      .populate('followers', 'username name avatar')
      .populate('following', 'username name avatar');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw error;
  }
};

// Search users
exports.searchUsers = async (query, limit = 10) => {
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username name avatar bio followerCount')
      .limit(limit);

    return users;
  } catch (error) {
    throw error;
  }
};

// Update user profile
exports.updateProfile = async (userId, updates) => {
  try {
    const allowedUpdates = ['name', 'bio', 'mobile', 'secondaryEmail'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    return user;
  } catch (error) {
    throw error;
  }
};

// Update password
exports.updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return true;
  } catch (error) {
    throw error;
  }
};

// Update username
exports.updateUsername = async (userId, newUsername) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true, runValidators: true }
    );

    return user;
  } catch (error) {
    throw error;
  }
};

// Follow user
exports.followUser = async (followerId, followingId) => {
  try {
    if (followerId.toString() === followingId) {
      throw new Error('You cannot follow yourself');
    }

    const user = await User.findById(followerId);
    const targetUser = await User.findById(followingId);

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if already following
    if (user.following.includes(followingId)) {
      throw new Error('Already following this user');
    }

    // Add to following and followers
    user.following.push(followingId);
    targetUser.followers.push(followerId);

    await user.save();
    await targetUser.save();

    return true;
  } catch (error) {
    throw error;
  }
};

// Unfollow user
exports.unfollowUser = async (followerId, followingId) => {
  try {
    const user = await User.findById(followerId);
    const targetUser = await User.findById(followingId);

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Remove from following and followers
    user.following = user.following.filter(id => id.toString() !== followingId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== followerId.toString());

    await user.save();
    await targetUser.save();

    return true;
  } catch (error) {
    throw error;
  }
};

// Delete account
exports.deleteAccount = async (userId) => {
  try {
    // Delete user's poems
    await Poem.deleteMany({ author: userId });

    // Delete user's collections
    await Collection.deleteMany({ owner: userId });

    // Remove user from followers/following lists
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    // Delete user
    await User.findByIdAndDelete(userId);

    return true;
  } catch (error) {
    throw error;
  }
};
