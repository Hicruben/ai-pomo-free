const StandaloneTask = require('../models/StandaloneTask');

// Get all standalone tasks for the current user
exports.getTasks = async (req, res) => {
  try {
    const tasks = await StandaloneTask.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('[standaloneTaskController] Error getting tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new standalone task
exports.createTask = async (req, res) => {
  try {
    const { title, estimatedPomodoros, dueDate, subtasks } = req.body;

    // Calculate final estimated pomodoros based on subtasks if present
    let finalEstimatedPomodoros = estimatedPomodoros || 1;
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      finalEstimatedPomodoros = subtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
    }

    const task = new StandaloneTask({
      user: req.user.id,
      title,
      estimatedPomodoros: finalEstimatedPomodoros,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error('[standaloneTaskController] Error creating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a standalone task
exports.updateTask = async (req, res) => {
  try {
    const { title, completed, estimatedPomodoros, dueDate, subtasks } = req.body;

    // Find task
    const task = await StandaloneTask.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Calculate final estimated pomodoros based on subtasks if present
    let finalEstimatedPomodoros = estimatedPomodoros;
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      finalEstimatedPomodoros = subtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
    }

    // Update task
    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;
    if (finalEstimatedPomodoros !== undefined) task.estimatedPomodoros = finalEstimatedPomodoros;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (subtasks !== undefined) task.subtasks = subtasks;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('[standaloneTaskController] Error updating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a standalone task
exports.deleteTask = async (req, res) => {
  try {
    // Find task
    const task = await StandaloneTask.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete task
    await StandaloneTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('[standaloneTaskController] Error deleting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Increment completed pomodoros for a task
exports.incrementCompletedPomodoros = async (req, res) => {
  try {
    // Find task
    const task = await StandaloneTask.findById(req.params.id);

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
    console.error('[standaloneTaskController] Error incrementing completed pomodoros:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
