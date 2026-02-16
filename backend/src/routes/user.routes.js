const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

// Validation middleware
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('mobile')
    .optional()
    .trim(),
  body('secondaryEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
];

const requestPasswordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
];

const verifyPasswordChangeValidation = [
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
];

const updateUsernameValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can only contain lowercase letters, numbers, and underscores')
];

const requestEmailUpdateValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newEmail')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const verifyEmailUpdateValidation = [
  body('newEmail')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be 6 digits')
];

const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deletion')
];

// Routes
router.get('/profile/:username', userController.getProfile);
router.get('/search', userController.searchUsers);

// Protected routes
router.put('/profile', protect, updateProfileValidation, userController.updateProfile);
router.put('/password', protect, updatePasswordValidation, userController.updatePassword);
router.put('/password/request', protect, requestPasswordChangeValidation, userController.requestPasswordChange);
router.put('/password/verify', protect, verifyPasswordChangeValidation, userController.verifyPasswordChange);
router.put('/username', protect, updateUsernameValidation, userController.updateUsername);
router.put('/email', protect, requestEmailUpdateValidation, userController.requestEmailUpdate);
router.put('/email/verify', protect, verifyEmailUpdateValidation, userController.verifyEmailUpdate);
router.post('/follow/:userId', protect, userController.followUser);
router.post('/unfollow/:userId', protect, userController.unfollowUser);
router.post('/bookmark/:poemId', protect, userController.bookmarkPoem);
router.post('/unbookmark/:poemId', protect, userController.unbookmarkPoem);
router.get('/bookmarks', protect, userController.getBookmarkedPoems);
router.get('/likes', protect, userController.getLikedPoems);
router.delete('/me', protect, deleteAccountValidation, userController.deleteAccount);

module.exports = router;
