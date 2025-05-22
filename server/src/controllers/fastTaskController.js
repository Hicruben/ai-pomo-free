const FastTask = require('../models/FastTask');

// Get all fast tasks for the current user
exports.getTasks = async (req, res) => {
  try {
    const tasks = await FastTask.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('[fastTaskController] Error getting tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single fast task by ID
exports.getTask = async (req, res) => {
  try {
    const task = await FastTask.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(task);
  } catch (err) {
    console.error('[fastTaskController] Error getting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new fast task
exports.createTask = async (req, res) => {
  try {
    const { description, estimatedPomodoros, dueDate } = req.body;

    const task = new FastTask({
      user: req.user.id,
      description,
      estimatedPomodoros: estimatedPomodoros || 1,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error('[fastTaskController] Error creating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a fast task
exports.updateTask = async (req, res) => {
  try {
    const { description, completed, estimatedPomodoros, dueDate } = req.body;

    // Find task
    const task = await FastTask.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update task
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;
    if (estimatedPomodoros !== undefined) task.estimatedPomodoros = estimatedPomodoros;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('[fastTaskController] Error updating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a fast task
exports.deleteTask = async (req, res) => {
  try {
    // Find task
    const task = await FastTask.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete task
    await FastTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('[fastTaskController] Error deleting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Increment completed pomodoros for a task
exports.incrementCompletedPomodoros = async (req, res) => {
  try {
    // Find task
    const task = await FastTask.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Increment completed pomodoros
    task.completedPomodoros += 1;
    await task.save();
    res.json(task);
  } catch (err) {
    console.error('[fastTaskController] Error incrementing completed pomodoros:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
