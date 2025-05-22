const Pomodoro = require('../models/Pomodoro');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Stats = require('../models/Stats');

// Get all pomodoros for the current user
exports.getPomodoros = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { user: req.user.id };

    // Add date range filter if provided
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const pomodoros = await Pomodoro.find(query)
      .sort({ startTime: -1 })
      .populate('task', 'title')
      .populate('project', 'title');

    res.json(pomodoros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new pomodoro
exports.createPomodoro = async (req, res) => {
  try {
    console.log('[pomodoroController] Received request body:', JSON.stringify(req.body, null, 2));
    console.log('[pomodoroController] User ID:', req.user.id);

    // Extract fields from request body, supporting both naming conventions
    const taskId = req.body.taskId || req.body.task;
    const projectId = req.body.projectId || req.body.project;
    const isStandalone = req.body.isStandalone || false;
    const { startTime, endTime, duration, completed, interrupted } = req.body;

    console.log('[pomodoroController] Extracted taskId:', taskId, 'type:', typeof taskId);
    console.log('[pomodoroController] Extracted projectId:', projectId, 'type:', typeof projectId);
    console.log('[pomodoroController] Extracted startTime:', startTime);
    console.log('[pomodoroController] Extracted endTime:', endTime);
    console.log('[pomodoroController] Extracted duration:', duration);
    console.log('[pomodoroController] Extracted completed:', completed);
    console.log('[pomodoroController] Extracted interrupted:', interrupted);

    // Validate required fields - project ID is only required for non-standalone pomodoros
    if (!isStandalone && !projectId) {
      console.log('[pomodoroController] ERROR: Project ID is required for non-standalone pomodoros but was not provided');
      return res.status(400).json({ message: 'Project ID is required for non-standalone pomodoros' });
    }

    // Verify project belongs to user (only for non-standalone pomodoros)
    if (!isStandalone && projectId) {
      try {
        const project = await Project.findOne({
          _id: projectId,
          user: req.user.id
        });

        if (!project) {
          return res.status(404).json({ message: 'Project not found or does not belong to user' });
        }
      } catch (projectError) {
        console.error('[pomodoroController] Error verifying project:', projectError);
        return res.status(500).json({ message: 'Error verifying project' });
      }
    }

    // Check for recent duplicate pomodoros to prevent double-insertion
    const recentTime = new Date(Date.now() - 10000); // Last 10 seconds
    console.log('[pomodoroController] Checking for duplicates since:', recentTime);

    try {
      // Build query based on whether this is a standalone pomodoro
      const query = {
        user: req.user.id,
        createdAt: { $gt: recentTime }
      };

      if (isStandalone) {
        query.isStandalone = true;
        if (taskId) query.task = taskId;
      } else {
        query.project = projectId;
        query.task = taskId || { $exists: false };
      }

      const existingPomodoros = await Pomodoro.find(query);

      console.log('[pomodoroController] Found existing pomodoros:', existingPomodoros.length);

      if (existingPomodoros.length > 0) {
        console.log('[pomodoroController] Duplicate pomodoro detected within last 10 seconds. Returning existing record.');
        return res.json(existingPomodoros[0]);
      }
    } catch (findError) {
      console.error('[pomodoroController] Error checking for existing pomodoros:', findError);
    }

    // Create new pomodoro
    console.log('[pomodoroController] Creating new pomodoro record');

    // Ensure interrupted is a boolean value
    let interruptedValue = false;
    if (interrupted !== undefined) {
      // If it's an object with wasInterrupted property, use that
      if (typeof interrupted === 'object' && interrupted !== null && interrupted.wasInterrupted !== undefined) {
        interruptedValue = Boolean(interrupted.wasInterrupted);
        console.log('[pomodoroController] Converted interrupted object to boolean:', interruptedValue);
      } else {
        // Otherwise convert the value directly to boolean
        interruptedValue = Boolean(interrupted);
        console.log('[pomodoroController] Converted interrupted to boolean:', interruptedValue);
      }
    }

    const pomodoroData = {
      user: req.user.id,
      startTime: startTime || new Date(Date.now() - duration * 60 * 1000),
      endTime: endTime || new Date(),
      duration: duration || 25,
      completed: completed !== undefined ? completed : true,
      interrupted: interruptedValue,
      isStandalone: isStandalone
    };

    // Add project ID for non-standalone pomodoros
    if (!isStandalone && projectId) {
      pomodoroData.project = projectId;
    }

    // Only add task if it exists
    if (taskId) {
      pomodoroData.task = taskId;
    }

    console.log('[pomodoroController] Pomodoro data to save:', JSON.stringify(pomodoroData, null, 2));

    const pomodoro = new Pomodoro(pomodoroData);

    try {
      await pomodoro.save();
      console.log(`[pomodoroController] Pomodoro saved successfully:`, JSON.stringify(pomodoro, null, 2));
      res.json(pomodoro);
    } catch (saveError) {
      console.error('[pomodoroController] Error saving pomodoro:', saveError);
      // Check if this is a validation error
      if (saveError.name === 'ValidationError') {
        console.error('[pomodoroController] Validation error details:', saveError.errors);
        return res.status(400).json({
          message: 'Validation error',
          errors: saveError.errors
        });
      }
      // Check if this is a duplicate key error
      if (saveError.code === 11000) {
        console.error('[pomodoroController] Duplicate key error:', saveError.keyValue);
        return res.status(400).json({
          message: 'Duplicate pomodoro record',
          keyValue: saveError.keyValue
        });
      }
      throw saveError; // Re-throw for the outer catch block
    }
  } catch (err) {
    console.error('[pomodoroController] Error creating pomodoro:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a pomodoro
exports.deletePomodoro = async (req, res) => {
  try {
    // Find pomodoro
    const pomodoro = await Pomodoro.findById(req.params.id);

    // Check if pomodoro exists
    if (!pomodoro) {
      return res.status(404).json({ message: 'Pomodoro not found' });
    }

    // Check if pomodoro belongs to user
    if (pomodoro.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete pomodoro
    await Pomodoro.findByIdAndDelete(req.params.id);

    res.json({ message: 'Pomodoro deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
