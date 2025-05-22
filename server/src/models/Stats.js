const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalPomodoros: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    pomodorosByDate: {
      type: Map,
      of: Number,
      default: {},
    },
    durationsByDate: {
      type: Map,
      of: Number,
      default: {},
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    experiencePoints: {
      type: Number,
      default: 0,
    },
    unlockedAchievements: {
      type: [String],
      default: [],
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    maxPomodorosInDay: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Stats', StatsSchema);
