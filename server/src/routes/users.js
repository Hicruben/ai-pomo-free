const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   GET /api/users/settings
// @desc    Get user settings
// @access  Private
router.get('/settings', auth.authenticateJWT, userController.getSettings);

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth.authenticateJWT, userController.updateSettings);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth.authenticateJWT, userController.updateProfile);

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', auth.authenticateJWT, userController.changePassword);

// @route   PUT /api/users/active-task
// @desc    Set active task
// @access  Private
router.put('/active-task', auth.authenticateJWT, userController.setActiveTask);

// @route   GET /api/users/active-task
// @desc    Get active task
// @access  Private
router.get('/active-task', auth.authenticateJWT, userController.getActiveTask);

// @route   GET /api/users/subscription
// @desc    Get user subscription
// @access  Private
router.get('/subscription', auth.authenticateJWT, userController.getSubscription);

// @route   GET /api/users/me
// @desc    Get current user's complete profile
// @access  Private
router.get('/me', auth.authenticateJWT, userController.getCurrentUserProfile);

module.exports = router;
