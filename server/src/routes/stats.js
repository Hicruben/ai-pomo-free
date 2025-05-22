const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

// @route   GET /api/stats
// @desc    Get stats for the current user
// @access  Private
router.get('/', auth.authenticateJWT, statsController.getStats);

// @route   PUT /api/stats/achievements
// @desc    Update achievements
// @access  Private
router.put('/achievements', auth.authenticateJWT, statsController.updateAchievements);

module.exports = router;
