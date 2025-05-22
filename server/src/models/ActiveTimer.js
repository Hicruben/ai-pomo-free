const mongoose = require('mongoose');

const ActiveTimerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user can only have one active timer
    },
    isRunning: {
      type: Boolean,
      default: false,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    currentSession: {
      type: String,
      enum: ['work', 'shortBreak', 'longBreak'],
      default: 'work',
    },
    timeRemaining: {
      type: Number, // in seconds
      required: true,
    },
    pomodoroCount: {
      type: Number,
      default: 0,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      // Only for work sessions
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      // Only for work sessions
    },
    lastUpdatedTime: {
      type: Date,
      default: Date.now,
    },
    // Store the session times directly in the timer to ensure consistency
    sessionTimes: {
      workTime: {
        type: Number,
        default: 25,
      },
      shortBreakTime: {
        type: Number,
        default: 5,
      },
      longBreakTime: {
        type: Number,
        default: 15,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ActiveTimer', ActiveTimerSchema);
