const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// @route   GET /api/tasks
// @desc    Get all tasks for the current user
// @access  Private
router.get('/', auth.authenticateJWT, taskController.getTasks);

// @route   GET /api/tasks/:id
// @desc    Get a single task by ID
// @access  Private
router.get('/:id', auth.authenticateJWT, taskController.getTaskById);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth.authenticateJWT, taskController.createTask);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth.authenticateJWT, taskController.updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth.authenticateJWT, taskController.deleteTask);

// @route   POST /api/tasks/import/todoist
// @desc    Import tasks from Todoist
// @access  Private
router.post(
  '/import/todoist',
  auth.authenticateJWT,
  taskController.importTodoistTasks
);

module.exports = router;
