const express = require('express');
const router = express.Router();
const aggregateController = require('../controllers/aggregateController');
const auth = require('../middleware/auth');

// @route   POST /api/aggregate/pomodoros
// @desc    Aggregate pomodoro data for the current user
// @access  Private
router.post('/pomodoros', auth.authenticateJWT, aggregateController.aggregatePomodoros);

module.exports = router;
