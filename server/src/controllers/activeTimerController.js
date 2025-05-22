const ActiveTimer = require('../models/ActiveTimer');
const { safeObjectId } = require('../utils/idUtils');

// Get the current user's active timer
exports.getActiveTimer = async (req, res) => {
  try {
    const activeTimer = await ActiveTimer.findOne({ user: req.user.id });

    if (!activeTimer) {
      return res.status(404).json({ message: 'No active timer found' });
    }

    // Get the user's settings to ensure we have the correct timer durations
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('settings');

    // Update the session times in the active timer with the user's current settings
    if (user && user.settings) {
      // Only update if the timer is not running or paused
      if (!activeTimer.isRunning && !activeTimer.isPaused) {
        // Update the session times
        activeTimer.sessionTimes = {
          workTime: user.settings.workTime || 25,
          shortBreakTime: user.settings.shortBreakTime || 5,
          longBreakTime: user.settings.longBreakTime || 15,
        };

        // Update the timeRemaining based on the current session
        if (activeTimer.currentSession === 'work') {
          activeTimer.timeRemaining = user.settings.workTime * 60;
        } else if (activeTimer.currentSession === 'shortBreak') {
          activeTimer.timeRemaining = user.settings.shortBreakTime * 60;
        } else if (activeTimer.currentSession === 'longBreak') {
          activeTimer.timeRemaining = user.settings.longBreakTime * 60;
        }

        // Save the updated timer
        await activeTimer.save();
      }
    }

    res.json(activeTimer);
  } catch (err) {
    console.error('Error getting active timer:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update the active timer
exports.updateActiveTimer = async (req, res) => {
  try {
    const {
      isRunning,
      isPaused,
      currentSession,
      timeRemaining,
      pomodoroCount,
      projectId,
      taskId,
      sessionTimes,
    } = req.body;

    // Process project ID if provided
    let processedProjectId = null;
    if (projectId) {
      processedProjectId = safeObjectId(projectId);
    }

    // Process task ID if provided
    let processedTaskId = null;
    if (taskId) {
      processedTaskId = safeObjectId(taskId);
    }

    // Get the user's settings to ensure we have the correct timer durations
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('settings');

    // Use the user's settings for session times, or fallback to provided values or defaults
    const userSessionTimes = {
      workTime: user?.settings?.workTime || (sessionTimes?.workTime || 25),
      shortBreakTime: user?.settings?.shortBreakTime || (sessionTimes?.shortBreakTime || 5),
      longBreakTime: user?.settings?.longBreakTime || (sessionTimes?.longBreakTime || 15),
    };

    console.log(`[activeTimerController] Using session times:`, userSessionTimes);

    // Calculate the correct timeRemaining based on the current session and user settings
    let correctTimeRemaining = timeRemaining;
    if (!isRunning && !isPaused) {
      // If timer is not running or paused, set the correct time based on session type
      if (currentSession === 'work') {
        correctTimeRemaining = userSessionTimes.workTime * 60;
      } else if (currentSession === 'shortBreak') {
        correctTimeRemaining = userSessionTimes.shortBreakTime * 60;
      } else if (currentSession === 'longBreak') {
        correctTimeRemaining = userSessionTimes.longBreakTime * 60;
      }
    }

    // Find and update or create a new active timer
    const activeTimer = await ActiveTimer.findOneAndUpdate(
      { user: req.user.id },
      {
        isRunning,
        isPaused,
        currentSession,
        timeRemaining: correctTimeRemaining,
        pomodoroCount: pomodoroCount || 0,
        projectId: processedProjectId,
        taskId: processedTaskId,
        lastUpdatedTime: new Date(),
        sessionTimes: userSessionTimes,
      },
      { new: true, upsert: true }
    );

    res.json(activeTimer);
  } catch (err) {
    console.error('Error updating active timer:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear the active timer
exports.clearActiveTimer = async (req, res) => {
  try {
    await ActiveTimer.findOneAndDelete({ user: req.user.id });
    res.json({ message: 'Active timer cleared' });
  } catch (err) {
    console.error('Error clearing active timer:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
