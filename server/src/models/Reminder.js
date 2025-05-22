const mongoose = require('mongoose');

// Reminder（提醒）模型
const ReminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: Date,
    },
    triggered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
  }
);

module.exports = mongoose.model('Reminder', ReminderSchema); 