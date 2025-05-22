const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['open', 'working', 'finished'],
      default: 'open',
    },
    description: {
      type: String,
      trim: true,
    },
    completedDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', ProjectSchema);
