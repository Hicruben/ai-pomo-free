const mongoose = require('mongoose');

// Reuse the same SubtaskSchema as in Task model
const SubtaskSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  estimatedPomodoros: { type: Number, default: 1 }
}, { _id: false });

const StandaloneTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
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
    isStandalone: {
      type: Boolean,
      default: true,
    },
    dueDate: {
      type: Date,
      // Optional due date for the task
    },
    subtasks: [SubtaskSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StandaloneTask', StandaloneTaskSchema);
