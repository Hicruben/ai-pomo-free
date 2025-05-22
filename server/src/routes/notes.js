const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');

// @route   GET /api/projects/:projectId/notes
// @desc    Get all notes for a project
// @access  Private
router.get('/:projectId/notes', auth.authenticateJWT, noteController.getNotes);

// @route   POST /api/projects/:projectId/notes
// @desc    Create a new note
// @access  Private
router.post('/:projectId/notes', auth.authenticateJWT, noteController.createNote);

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/notes/:id', auth.authenticateJWT, noteController.updateNote);

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/notes/:id', auth.authenticateJWT, noteController.deleteNote);

module.exports = router;
