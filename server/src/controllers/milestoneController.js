const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const { safeObjectId, toObjectId } = require('../utils/idUtils');

// Get all milestones for a project
exports.getMilestones = async (req, res) => {
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

    const milestones = await Milestone.find({
      project: projectId,
      user: req.user.id
    }).sort({ position: 1, dueDate: 1 });

    res.json(milestones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new milestone
exports.createMilestone = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, dueDate, position } = req.body;

    // Verify project belongs to user
    const project = await Project.findOne({
      _id: projectId,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get highest position if not provided
    let milestonePosition = position;
    if (milestonePosition === undefined) {
      const highestPositionMilestone = await Milestone.findOne({
        project: projectId
      }).sort({ position: -1 });

      milestonePosition = highestPositionMilestone ? highestPositionMilestone.position + 1 : 0;
    }

    const milestone = new Milestone({
      project: projectId,
      user: req.user.id,
      title,
      dueDate,
      position: milestonePosition
    });

    await milestone.save();
    res.status(201).json(milestone);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a milestone
exports.updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dueDate, completed, position } = req.body;

    // Safely convert the ID parameter to a valid ObjectId
    const milestoneId = safeObjectId(id);

    if (!milestoneId) {
      console.log(`[milestoneController] Invalid milestone ID format: ${id}`);
      return res.status(400).json({ message: 'Invalid milestone ID format' });
    }

    // Find milestone
    let milestone = await Milestone.findById(milestoneId);

    // Check if milestone exists
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check if milestone belongs to user
    if (milestone.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (position !== undefined) updateData.position = position;

    // Handle completion status
    if (completed !== undefined) {
      updateData.completed = completed;
      if (completed) {
        updateData.completedDate = new Date();
      } else {
        updateData.completedDate = null;
      }
    }

    // Update milestone
    milestone = await Milestone.findByIdAndUpdate(
      milestoneId,
      updateData,
      { new: true }
    );

    res.json(milestone);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a milestone
exports.deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[milestoneController] Deleting milestone with ID: ${id}, type: ${typeof id}`);

    // Safely convert the ID parameter to a valid ObjectId
    const milestoneId = safeObjectId(id);

    if (!milestoneId) {
      console.log(`[milestoneController] Invalid milestone ID format: ${id}`);
      return res.status(400).json({ message: 'Invalid milestone ID format' });
    }

    console.log(`[milestoneController] Converted milestone ID: ${milestoneId}`);

    // Find milestone
    const milestone = await Milestone.findById(milestoneId);

    // Check if milestone exists
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check if milestone belongs to user
    if (milestone.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete milestone
    await Milestone.findByIdAndDelete(milestoneId);

    console.log(`[milestoneController] Milestone ${milestoneId} deleted successfully`);
    res.json({ message: 'Milestone removed' });
  } catch (err) {
    console.error('[milestoneController] Error deleting milestone:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid milestone ID format' });
    }
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};
