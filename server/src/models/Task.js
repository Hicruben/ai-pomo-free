const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  estimatedPomodoros: { type: Number, default: 1 }
}, { _id: false });

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
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
    dueDate: {
      type: Date,
      // Optional due date for the task
    },
    todoistId: {
      type: String,
      // Only for tasks imported from Todoist
    },
    source: {
      type: String,
      enum: ['app', 'todoist'],
      default: 'app',
    },
    subtasks: [SubtaskSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', TaskSchema);
