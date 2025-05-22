const express = require('express');
const router = express.Router();
const standaloneTaskController = require('../controllers/standaloneTaskController');
const auth = require('../middleware/auth');

// @route   GET /api/standalone-tasks
// @desc    Get all standalone tasks for the current user
// @access  Private
router.get('/', auth.authenticateJWT, standaloneTaskController.getTasks);

// @route   POST /api/standalone-tasks
// @desc    Create a new standalone task
// @access  Private
router.post('/', auth.authenticateJWT, standaloneTaskController.createTask);

// @route   PUT /api/standalone-tasks/:id
// @desc    Update a standalone task
// @access  Private
router.put('/:id', auth.authenticateJWT, standaloneTaskController.updateTask);

// @route   DELETE /api/standalone-tasks/:id
// @desc    Delete a standalone task
// @access  Private
router.delete('/:id', auth.authenticateJWT, standaloneTaskController.deleteTask);

// @route   PUT /api/standalone-tasks/:id/increment
// @desc    Increment completed pomodoros for a task
// @access  Private
router.put('/:id/increment', auth.authenticateJWT, standaloneTaskController.incrementCompletedPomodoros);

module.exports = router;
