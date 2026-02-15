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

const updateUsernameValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can only contain lowercase letters, numbers, and underscores')
];

// Routes
router.get('/profile/:username', userController.getProfile);
router.get('/search', userController.searchUsers);

// Protected routes
router.put('/profile', protect, updateProfileValidation, userController.updateProfile);
router.put('/password', protect, updatePasswordValidation, userController.updatePassword);
router.put('/username', protect, updateUsernameValidation, userController.updateUsername);
router.post('/follow/:userId', protect, userController.followUser);
router.post('/unfollow/:userId', protect, userController.unfollowUser);
router.delete('/account', protect, userController.deleteAccount);

module.exports = router;
