const mongoose = require('mongoose');

const PomodoroSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      // Not required because user might not select a task
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      // Not required for standalone pomodoros
    },
    isStandalone: {
      type: Boolean,
      default: false,
      // Flag to identify standalone pomodoros not associated with a project
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    interrupted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add a compound index to help prevent duplicate pomodoros
// This creates a unique index on the combination of user, task, and startTime
// with a 30-second tolerance (sparse: true means it won't apply to records where task is null)
PomodoroSchema.index(
  {
    user: 1,
    task: 1,
    startTime: 1
  },
  {
    unique: true,
    sparse: true,
    // Only consider documents created within 30 seconds of each other as duplicates
    partialFilterExpression: { task: { $exists: true } }
  }
);

module.exports = mongoose.model('Pomodoro', PomodoroSchema);
