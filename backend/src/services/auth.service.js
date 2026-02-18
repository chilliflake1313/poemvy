const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate JWT refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Register new user
exports.register = async (username, email, password, name = null) => {
  try {
    // Create user
    const userData = {
      username,
      email,
      password
    };
    
    // Add name if provided
    if (name) {
      userData.name = name;
    }
    
    const user = await User.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  } catch (error) {
    throw error;
  }
};

// Login user
exports.login = async (email, password) => {
  try {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  } catch (error) {
    throw error;
  }
};

// Refresh access token
exports.refreshToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.id,
      'refreshTokens.token': refreshToken
    });

    if (!user) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    return { accessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Logout user
exports.logout = async (userId, refreshToken) => {
  try {
    // Remove refresh token from user
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } }
    });
  } catch (error) {
    throw error;
  }
};
