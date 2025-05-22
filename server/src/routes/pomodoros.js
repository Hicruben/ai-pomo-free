const express = require('express');
const router = express.Router();
const pomodoroController = require('../controllers/pomodoroController');
const auth = require('../middleware/auth');

// @route   GET /api/pomodoros
// @desc    Get all pomodoros for the current user
// @access  Private
router.get('/', auth.authenticateJWT, pomodoroController.getPomodoros);

// @route   POST /api/pomodoros
// @desc    Create a new pomodoro
// @access  Private
router.post('/', auth.authenticateJWT, pomodoroController.createPomodoro);

// @route   DELETE /api/pomodoros/:id
// @desc    Delete a pomodoro
// @access  Private
router.delete('/:id', auth.authenticateJWT, pomodoroController.deletePomodoro);

module.exports = router;
