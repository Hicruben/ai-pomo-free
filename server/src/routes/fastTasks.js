const express = require('express');
const router = express.Router();
const fastTaskController = require('../controllers/fastTaskController');
const auth = require('../middleware/auth');

// @route   GET /api/fast-tasks
// @desc    Get all fast tasks for the current user
// @access  Private
router.get('/', auth.authenticateJWT, fastTaskController.getTasks);

// @route   GET /api/fast-tasks/:id
// @desc    Get a single fast task by ID
// @access  Private
router.get('/:id', auth.authenticateJWT, fastTaskController.getTask);

// @route   POST /api/fast-tasks
// @desc    Create a new fast task
// @access  Private
router.post('/', auth.authenticateJWT, fastTaskController.createTask);

// @route   PUT /api/fast-tasks/:id
// @desc    Update a fast task
// @access  Private
router.put('/:id', auth.authenticateJWT, fastTaskController.updateTask);

// @route   DELETE /api/fast-tasks/:id
// @desc    Delete a fast task
// @access  Private
router.delete('/:id', auth.authenticateJWT, fastTaskController.deleteTask);

// @route   PUT /api/fast-tasks/:id/increment
// @desc    Increment completed pomodoros for a task
// @access  Private
router.put('/:id/increment', auth.authenticateJWT, fastTaskController.incrementCompletedPomodoros);

module.exports = router;
