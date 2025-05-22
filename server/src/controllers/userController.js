const User = require('../models/User');
const Task = require('../models/Task');
const Subscription = require('../models/Subscription');
const { safeObjectId, toObjectId } = require('../utils/idUtils');

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    console.log(`[userController] Getting settings for user ${req.user.id}`);

    // Find user and return settings
    const user = await User.findById(req.user.id).select('settings -_id');

    if (!user) {
      console.error(`[userController] User not found with ID: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[userController] Settings retrieved successfully for user ${req.user.id}`);
    console.log(`[userController] User settings:`, user.settings);

    res.json(user);
  } catch (err) {
    console.error(`[userController] Error getting settings:`, err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    console.log(`[userController] Updating settings for user ${req.user.id}`);
    console.log(`[userController] New settings:`, settings);

    // Validate settings object
    if (!settings) {
      console.error(`[userController] Settings object is missing or invalid`);
      return res.status(400).json({ message: 'Settings object is required' });
    }

    // Find user and update settings
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { settings },
      { new: true }
    ).select('-password');

    if (!user) {
      console.error(`[userController] User not found with ID: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[userController] Settings updated successfully for user ${req.user.id}`);
    console.log(`[userController] Updated user:`, user);

    // Also update the active timer with the new settings if it exists
    try {
      const ActiveTimer = require('../models/ActiveTimer');
      const activeTimer = await ActiveTimer.findOne({ user: req.user.id });

      if (activeTimer) {
        console.log(`[userController] Updating active timer with new settings`);

        // Update the session times in the active timer
        activeTimer.sessionTimes = {
          workTime: settings.workTime || 25,
          shortBreakTime: settings.shortBreakTime || 5,
          longBreakTime: settings.longBreakTime || 15,
        };

        // Only update the timeRemaining if the timer is not running or paused
        if (!activeTimer.isRunning && !activeTimer.isPaused) {
          // Update the timeRemaining based on the current session
          if (activeTimer.currentSession === 'work') {
            activeTimer.timeRemaining = settings.workTime * 60;
          } else if (activeTimer.currentSession === 'shortBreak') {
            activeTimer.timeRemaining = settings.shortBreakTime * 60;
          } else if (activeTimer.currentSession === 'longBreak') {
            activeTimer.timeRemaining = settings.longBreakTime * 60;
          }
        }

        // Save the updated timer
        await activeTimer.save();
        console.log(`[userController] Active timer updated with new settings`);
      }
    } catch (timerErr) {
      console.error(`[userController] Error updating active timer:`, timerErr);
      // Don't fail the whole request if updating the timer fails
    }

    res.json(user);
  } catch (err) {
    console.error(`[userController] Error updating settings:`, err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set active task
exports.setActiveTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    const ActiveTimer = require('../models/ActiveTimer');

    // Validate task exists and belongs to user
    if (taskId) {
      // Safely convert the task ID to a valid ObjectId
      const safeTaskId = safeObjectId(taskId);

      if (!safeTaskId) {
        return res.status(400).json({ message: 'Invalid task ID format' });
      }

      const task = await Task.findOne({
        _id: safeTaskId,
        user: req.user.id,
        completed: false // Only non-completed tasks can be active
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found or not available' });
      }

      // Update user's active task
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { activeTask: safeTaskId },
        { new: true }
      )
      .select('-password')
      .populate({
        path: 'activeTask',
        select: 'title estimatedPomodoros completedPomodoros project completed'
      });

      // If there's an active timer running, reset it when switching tasks
      const activeTimer = await ActiveTimer.findOne({ user: req.user.id });
      if (activeTimer && activeTimer.isRunning) {
        // Reset the timer
        await ActiveTimer.findOneAndUpdate(
          { user: req.user.id },
          {
            isRunning: false,
            isPaused: false,
            taskId: safeTaskId,
            projectId: task.project
          },
          { new: true }
        );
      }

      res.json(user);
    } else {
      // Clear active task
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { activeTask: null },
        { new: true }
      )
      .select('-password');

      // If there's an active timer running, reset it when clearing active task
      const activeTimer = await ActiveTimer.findOne({ user: req.user.id });
      if (activeTimer && activeTimer.isRunning) {
        // Reset the timer
        await ActiveTimer.findOneAndUpdate(
          { user: req.user.id },
          {
            isRunning: false,
            isPaused: false,
            taskId: null,
            projectId: null
          },
          { new: true }
        );
      }

      res.json(user);
    }
  } catch (err) {
    console.error('Error in setActiveTask:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active task
exports.getActiveTask = async (req, res) => {
  try {
    console.log(`[userController] Getting active task for user: ${req.user.id}`);

    const user = await User.findById(req.user.id)
      .select('activeTask')
      .populate({
        path: 'activeTask',
        select: 'title estimatedPomodoros completedPomodoros project completed',
        populate: {
          path: 'project',
          select: 'title'
        }
      });

    if (!user.activeTask) {
      console.log(`[userController] No active task found for user: ${req.user.id}`);
      return res.json({ activeTask: null });
    }

    console.log(`[userController] Active task found for user: ${req.user.id}`, {
      taskId: user.activeTask._id,
      title: user.activeTask.title
    });

    res.json({ activeTask: user.activeTask });
  } catch (err) {
    console.error(`[userController] Error getting active task:`, err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if email is already taken
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Find user and update profile
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    // Check if user has a password (not Google OAuth)
    if (!user.password) {
      return res.status(400).json({
        message: 'This account uses Google Sign-In and does not have a password',
      });
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user subscription
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('subscription');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.subscription);
  } catch (err) {
    console.error('Error getting subscription:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user's complete profile
exports.getCurrentUserProfile = async (req, res) => {
  try {
    console.log(`[userController] Getting complete profile for user ${req.user.id}`);

    // Find user and return complete profile
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('subscriptionId');

    if (!user) {
      console.error(`[userController] User not found with ID: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[userController] Profile retrieved successfully for user ${req.user.id}`);
    console.log(`[userController] User subscription status: ${user.subscriptionStatus}`);
    console.log(`[userController] User max projects: ${user.maxProjects}`);

    res.json(user);
  } catch (err) {
    console.error(`[userController] Error getting user profile:`, err);
    res.status(500).json({ message: 'Server error' });
  }
};
