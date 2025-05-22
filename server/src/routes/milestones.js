const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const auth = require('../middleware/auth');

// @route   GET /api/projects/:projectId/milestones
// @desc    Get all milestones for a project
// @access  Private
router.get('/:projectId/milestones', auth.authenticateJWT, milestoneController.getMilestones);

// @route   POST /api/projects/:projectId/milestones
// @desc    Create a new milestone
// @access  Private
router.post('/:projectId/milestones', auth.authenticateJWT, milestoneController.createMilestone);

// @route   PUT /milestones/:id
// @desc    Update a milestone
// @access  Private
router.put('/:id', auth.authenticateJWT, milestoneController.updateMilestone);

// @route   DELETE /milestones/:id
// @desc    Delete a milestone
// @access  Private
router.delete('/:id', auth.authenticateJWT, milestoneController.deleteMilestone);

module.exports = router;
