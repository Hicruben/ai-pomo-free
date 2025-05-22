const Task = require('../models/Task');
const Stats = require('../models/Stats');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const { safeObjectId, toObjectId } = require('../utils/idUtils');
const { Types } = require('mongoose');

// Get all tasks for the current user
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;

    // Build filter object
    const filter = { user: req.user.id };
    if (projectId) {
      // Special case for standalone tasks
      if (projectId === 'standalone') {
        // For standalone tasks, we don't need to verify a project
        // We'll just return tasks that don't have a project
        filter.project = { $exists: false };
      } else {
        try {
          // Convert projectId to ObjectId
          const projectObjectId = new Types.ObjectId(projectId);
          // Verify project belongs to user
          const project = await Project.findOne({
            _id: projectObjectId,
            user: req.user.id
          });

          if (!project) {
            return res.status(404).json({ message: 'Project not found' });
          }

          filter.project = projectObjectId;
        } catch (error) {
          console.error('Error converting projectId to ObjectId:', error);
          return res.status(400).json({ message: 'Invalid project ID format' });
        }
      }
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    // Get the Pomodoro model
    const Pomodoro = require('../models/Pomodoro');

    // Get completed pomodoros for all tasks
    const taskIds = tasks.map(task => task._id);
    const pomodoroAggregation = await Pomodoro.aggregate([
      {
        $match: {
          task: { $in: taskIds },
          user: new Types.ObjectId(req.user.id),
          completed: true
        }
      },
      {
        $group: {
          _id: '$task',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of task ID to completed pomodoro count
    const pomodoroCountMap = {};
    pomodoroAggregation.forEach(item => {
      pomodoroCountMap[item._id.toString()] = item.count;
    });

    // Removed excessive logging of pomodoro count map

    // Patch estimatedPomodoros and add completedPomodoros in response for all tasks
    const patchedTasks = tasks.map(task => {
      const t = task.toObject();
      if (t.subtasks && t.subtasks.length > 0) {
        t.estimatedPomodoros = t.subtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
      }

      // Add completedPomodoros from the pomodoro count map
      t.completedPomodoros = pomodoroCountMap[t._id.toString()] || 0;

      return t;
    });

    res.json(patchedTasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
  try {
    // Safely convert the ID parameter to a valid ObjectId
    const taskId = safeObjectId(req.params.id);

    if (!taskId) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findOne({ _id: taskId, user: req.user.id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Calculate completedPomodoros from the pomodoro table
    const Pomodoro = require('../models/Pomodoro');
    const completedPomodoros = await Pomodoro.countDocuments({
      task: taskId,
      user: req.user.id,
      completed: true
    });

    // Removed excessive logging of completedPomodoros calculation

    const t = task.toObject();
    if (t.subtasks && t.subtasks.length > 0) {
      t.estimatedPomodoros = t.subtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
    }

    // Add completedPomodoros to the response
    t.completedPomodoros = completedPomodoros;

    res.json(t);
  } catch (err) {
    console.error('Error in getTaskById:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, estimatedPomodoros, projectId, subtasks, dueDate } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Special case for standalone tasks
    if (projectId === 'standalone') {
      // For standalone tasks, we don't need to verify a project
      // We'll create a task without a project reference
    } else {
      try {
        // Verify project belongs to user
        const project = await Project.findOne({
          _id: projectId,
          user: req.user.id
        });

        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }
      } catch (error) {
        console.error('Error finding project:', error);
        return res.status(400).json({ message: 'Invalid project ID format' });
      }
    }

    let finalEstimatedPomodoros = estimatedPomodoros || 1;
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      finalEstimatedPomodoros = subtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
    }

    // Create task object with or without project reference
    const taskData = {
      user: req.user.id,
      title,
      estimatedPomodoros: finalEstimatedPomodoros,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };

    // Only add project reference if it's not a standalone task
    if (projectId !== 'standalone') {
      taskData.project = projectId;
    }

    const task = new Task(taskData);

    await task.save();

    // If task has a due date and it's not a standalone task, create a milestone for it
    if (dueDate && projectId !== 'standalone') {
      try {
        // Check if a milestone already exists for this date
        const existingMilestone = await Milestone.findOne({
          project: projectId,
          user: req.user.id,
          dueDate: {
            $gte: new Date(new Date(dueDate).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(dueDate).setHours(23, 59, 59, 999))
          }
        });

        if (!existingMilestone) {
          // Get highest position for new milestone
          const highestPositionMilestone = await Milestone.findOne({
            project: projectId
          }).sort({ position: -1 });

          const milestonePosition = highestPositionMilestone ? highestPositionMilestone.position + 1 : 0;

          // Create a new milestone
          const milestone = new Milestone({
            project: projectId,
            user: req.user.id,
            title: `Task Due: ${title}`,
            dueDate: new Date(dueDate),
            position: milestonePosition
          });

          await milestone.save();
        }
      } catch (error) {
        console.error('Error creating milestone:', error);
        // We'll continue even if milestone creation fails
      }
    }

    const t = task.toObject();
    if (t.subtasks && t.subtasks.length > 0) {
      t.estimatedPomodoros = t.subtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
    }
    res.status(201).json(t);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const { title, estimatedPomodoros, completed, subtasks, dueDate } = req.body;

    console.log(`[taskController] updateTask called with:`, req.body);
    console.log(`[taskController] Task ID: ${req.params.id}`);

    // Safely convert the ID parameter to a valid ObjectId
    const taskId = safeObjectId(req.params.id);

    if (!taskId) {
      console.log(`[taskController] Invalid task ID format: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    // Find task
    let task = await Task.findById(taskId);

    // Check if task exists
    if (!task) {
      console.log(`[taskController] Task not found with ID: ${taskId}`);
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log(`[taskController] Found task:`, task);

    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      console.log(`[taskController] Not authorized. Task user: ${task.user}, Request user: ${req.user.id}`);
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if task is being marked as completed
    const wasCompleted = task.completed;
    const isNowCompleted = completed !== undefined ? completed : wasCompleted;

    // Calculate new estimatedPomodoros if subtasks are present
    let finalEstimatedPomodoros = estimatedPomodoros || task.estimatedPomodoros;
    let updatedSubtasks = subtasks ? subtasks : task.subtasks;
    if (Array.isArray(updatedSubtasks) && updatedSubtasks.length > 0) {
      finalEstimatedPomodoros = updatedSubtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
    }

    // Check if due date is being updated
    const oldDueDate = task.dueDate;
    const newDueDate = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : oldDueDate;

    // Update task
    task = await Task.findByIdAndUpdate(
      taskId,
      {
        title: title || task.title,
        estimatedPomodoros: finalEstimatedPomodoros,
        completed: isNowCompleted,
        dueDate: newDueDate,
        ...(subtasks ? { subtasks } : {}),
      },
      { new: true }
    );

    console.log(`[taskController] Task updated successfully.`);

    // Handle milestone creation/update if due date has changed
    if (dueDate !== undefined && (!oldDueDate || (newDueDate && oldDueDate.getTime() !== newDueDate.getTime()))) {
      if (newDueDate) {
        // Check if a milestone already exists for this date
        const existingMilestone = await Milestone.findOne({
          project: task.project,
          user: req.user.id,
          dueDate: {
            $gte: new Date(new Date(newDueDate).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(newDueDate).setHours(23, 59, 59, 999))
          }
        });

        if (!existingMilestone) {
          // Get highest position for new milestone
          const highestPositionMilestone = await Milestone.findOne({
            project: task.project
          }).sort({ position: -1 });

          const milestonePosition = highestPositionMilestone ? highestPositionMilestone.position + 1 : 0;

          // Create a new milestone
          const milestone = new Milestone({
            project: task.project,
            user: req.user.id,
            title: `Task Due: ${task.title}`,
            dueDate: new Date(newDueDate),
            position: milestonePosition
          });

          await milestone.save();
        }
      }
    }

    // Update stats if task is being marked as completed
    if (!wasCompleted && isNowCompleted) {
      await Stats.findOneAndUpdate(
        { user: req.user.id },
        { $inc: { completedTasks: 1 } }
      );
    }

    // Calculate completedPomodoros from the pomodoro table
    const Pomodoro = require('../models/Pomodoro');
    const completedPomodoros = await Pomodoro.countDocuments({
      task: taskId,
      user: req.user.id,
      completed: true
    });

    // Removed excessive logging of completedPomodoros calculation

    const t = task.toObject();
    if (t.subtasks && t.subtasks.length > 0) {
      t.estimatedPomodoros = t.subtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
    }

    // Add completedPomodoros to the response
    t.completedPomodoros = completedPomodoros;

    res.json(t);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    // Safely convert the ID parameter to a valid ObjectId
    const taskId = safeObjectId(req.params.id);

    if (!taskId) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    // Find task
    const task = await Task.findById(taskId);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete task
    await Task.findByIdAndDelete(taskId);
    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error('Error in deleteTask:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Import tasks from Todoist
exports.importTodoistTasks = async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'No tasks provided' });
    }

    // Create tasks
    const taskPromises = tasks.map(async (taskData) => {
      // Check if task already exists
      const existingTask = await Task.findOne({
        user: req.user.id,
        todoistId: taskData.todoistId,
      });

      if (existingTask) {
        // Update existing task
        return Task.findByIdAndUpdate(
          existingTask._id,
          {
            title: taskData.title,
            estimatedPomodoros: taskData.estimatedPomodoros || 1,
            completed: taskData.completed || false,
          },
          { new: true }
        );
      } else {
        // Create new task
        const task = new Task({
          user: req.user.id,
          title: taskData.title,
          estimatedPomodoros: taskData.estimatedPomodoros || 1,
          todoistId: taskData.todoistId,
          source: 'todoist',
        });

        return task.save();
      }
    });

    const savedTasks = await Promise.all(taskPromises);
    res.status(201).json(savedTasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
