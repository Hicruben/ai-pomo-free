const mongoose = require('mongoose');

const FastTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    estimatedPomodoros: {
      type: Number,
      default: 1,
    },
    completedPomodoros: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
      // Optional due date for the task
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FastTask', FastTaskSchema);
