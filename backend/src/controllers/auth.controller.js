const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const Otp = require('../models/Otp');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/mailer');

// Signup - Create user and send verification email
exports.signup = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user with isEmailVerified: false
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      isEmailVerified: false
    });

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP to database
    await Otp.create({
      email: email.toLowerCase(),
      code,
      type: 'verification',
      expiresAt
    });

    // Send verification email
    try {
      await sendOTPEmail(email, code);
      
      res.status(201).json({
        success: true,
        message: 'Account created! Please check your email for verification code.',
        email: email.toLowerCase()
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Delete the user and OTP if email fails
      await User.deleteOne({ _id: user._id });
      await Otp.deleteMany({ email: email.toLowerCase() });
      
      res.status(500).json({ 
        error: 'Failed to send verification email. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Verify Email - Confirm OTP and activate account
exports.verifyEmail = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    // Find matching OTP
    const otp = await Otp.findOne({ 
      email: email.toLowerCase(),
      type: 'verification'
    }).select('+code');

    // Check if OTP exists
    if (!otp) {
      return res.status(400).json({ 
        error: 'Invalid verification code' 
      });
    }

    // Check if expired
    if (otp.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ 
        error: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Check if already used
    if (otp.used) {
      return res.status(400).json({ 
        error: 'Verification code has already been used' 
      });
    }

    // Check max attempts
    if (otp.attempts >= 5) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ 
        error: 'Too many failed attempts. Please request a new code.' 
      });
    }

    // Verify code using bcrypt
    const isValidCode = await otp.compareCode(code);
    if (!isValidCode) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ 
        error: 'Invalid verification code' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found. Please sign up first.' 
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ 
        error: 'Email already verified. Please login.' 
      });
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Mark user as verified
    user.isEmailVerified = true;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Clean up used OTP
    await Otp.deleteOne({ _id: otp._id });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to Poemvy.',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      accessToken: result.accessToken
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(req.user._id, refreshToken);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Request Password Reset - Send OTP to email
exports.requestPasswordReset = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if email exists or not (security best practice)
    // Always return success to prevent email enumeration
    
    if (user) {
      // Delete any existing password reset OTPs for this email
      await Otp.deleteMany({ 
        email: email.toLowerCase(), 
        type: 'password-reset' 
      });

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Set expiry to 5 minutes
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Save OTP to database
      await Otp.create({
        email: email.toLowerCase(),
        code,
        type: 'password-reset',
        expiresAt
      });

      // Send email
      try {
        await sendOTPEmail(email, code, 'Password Reset');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't reveal email failure to user for security
      }
    }

    // Always return success (don't reveal if email exists)
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset code.'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// Reset Password - Verify OTP and set new password
exports.resetPassword = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code, newPassword, confirmPassword } = req.body;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find matching OTP
    const otp = await Otp.findOne({ 
      email: email.toLowerCase(),
      type: 'password-reset'
    }).select('+code');

    // Check if OTP exists
    if (!otp) {
      return res.status(400).json({ 
        error: 'Invalid reset code' 
      });
    }

    // Check if expired
    if (otp.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ 
        error: 'Reset code has expired. Please request a new one.' 
      });
    }

    // Check if already used
    if (otp.used) {
      return res.status(400).json({ 
        error: 'Reset code has already been used' 
      });
    }

    // Check max attempts
    if (otp.attempts >= 5) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ 
        error: 'Too many failed attempts. Please request a new code.' 
      });
    }

    // Verify code using bcrypt
    const isValidCode = await otp.compareCode(code);
    if (!isValidCode) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ 
        error: 'Invalid reset code' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Clean up used OTP
    await Otp.deleteOne({ _id: otp._id });

    // Clear all existing refresh tokens (logout from all devices)
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

