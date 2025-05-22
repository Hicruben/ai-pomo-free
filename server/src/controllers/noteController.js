const Note = require('../models/Note');
const Project = require('../models/Project');

// Get all notes for a project
exports.getNotes = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await Project.findOne({
      _id: projectId,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const notes = await Note.find({
      project: projectId,
      user: req.user.id
    }).sort({ position: 1, createdAt: -1 });

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, color, position } = req.body;

    // Verify project belongs to user
    const project = await Project.findOne({
      _id: projectId,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get highest position if not provided
    let notePosition = position;
    if (notePosition === undefined) {
      const highestPositionNote = await Note.findOne({
        project: projectId
      }).sort({ position: -1 });

      notePosition = highestPositionNote ? highestPositionNote.position + 1 : 0;
    }

    const note = new Note({
      project: projectId,
      user: req.user.id,
      content,
      color: color || '#ffffff',
      position: notePosition
    });

    await note.save();
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a note
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, color, position } = req.body;

    // Find note
    let note = await Note.findById(id);

    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note belongs to user
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update fields
    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (color !== undefined) updateData.color = color;
    if (position !== undefined) updateData.position = position;

    // Update note
    note = await Note.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a note
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Find note
    const note = await Note.findById(id);

    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note belongs to user
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete note
    await Note.findByIdAndDelete(id);

    res.json({ message: 'Note removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
