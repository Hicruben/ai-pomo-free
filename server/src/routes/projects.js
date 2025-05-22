const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

// @route   GET /api/projects
// @desc    Get all projects for the current user
// @access  Private
router.get('/', auth.authenticateJWT, projectController.getProjects);

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', auth.authenticateJWT, projectController.createProject);

// @route   PUT /api/projects/positions
// @desc    Update project positions
// @access  Private
router.put('/positions', auth.authenticateJWT, projectController.updateProjectPositions);

// @route   GET /api/projects/:id
// @desc    Get a single project by ID
// @access  Private
router.get('/:id', auth.authenticateJWT, projectController.getProjectById);

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', auth.authenticateJWT, projectController.updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', auth.authenticateJWT, projectController.deleteProject);

// @route   PUT /api/projects/:id/working
// @desc    Set project as "working on"
// @access  Private
router.put('/:id/working', auth.authenticateJWT, projectController.setProjectAsWorking);

// @route   PUT /api/projects/:id/finish
// @desc    Mark project as finished
// @access  Private
router.put('/:id/finish', auth.authenticateJWT, projectController.finishProject);

module.exports = router;
