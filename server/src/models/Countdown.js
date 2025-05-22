const mongoose = require('mongoose');

// Countdown（倒计时）模型
const CountdownSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['timer', 'date'], // timer: 分钟秒，date: 日期倒计时
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    targetTime: {
      type: Date, // 仅 date 类型用
    },
    duration: {
      type: Number, // 仅 timer 类型用，单位秒
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
  }
);

module.exports = mongoose.model('Countdown', CountdownSchema); 