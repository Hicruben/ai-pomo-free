const express = require('express');
const router = express.Router();
const activeTimerController = require('../controllers/activeTimerController');
const auth = require('../middleware/auth');

// @route   GET /api/active-timer
// @desc    Get the current user's active timer
// @access  Private
router.get('/', auth.authenticateJWT, activeTimerController.getActiveTimer);

// @route   POST /api/active-timer
// @desc    Create or update the active timer
// @access  Private
router.post('/', auth.authenticateJWT, activeTimerController.updateActiveTimer);

// @route   DELETE /api/active-timer
// @desc    Clear the active timer
// @access  Private
router.delete('/', auth.authenticateJWT, activeTimerController.clearActiveTimer);

module.exports = router;
