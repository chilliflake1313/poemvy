const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { 
  authLimiter, 
  passwordResetLimiter, 
  otpVerifyLimiter 
} = require('../middleware/rateLimiter');

// Validation middleware
const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can only contain lowercase letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const verifyEmailValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be 6 digits')
    .isNumeric()
    .withMessage('Code must contain only numbers')
];

const requestPasswordResetValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be 6 digits')
    .isNumeric()
    .withMessage('Code must contain only numbers'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
];

// Routes
router.post('/signup', authLimiter, signupValidation, authController.signup);
router.post('/verify-email', otpVerifyLimiter, verifyEmailValidation, authController.verifyEmail);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/request-password-reset', passwordResetLimiter, requestPasswordResetValidation, authController.requestPasswordReset);
router.post('/reset-password', otpVerifyLimiter, resetPasswordValidation, authController.resetPassword);
router.post('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
