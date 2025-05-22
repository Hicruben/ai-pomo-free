/**
 * Admin Controller
 *
 * Handles admin-related functionality for user management and statistics
 */

const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * Get today's stats for admin dashboard
 */
exports.getTodayStats = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    // Get models
    const Task = require('../models/Task');
    const Project = require('../models/Project');
    const Pomodoro = require('../models/Pomodoro');

    // Get today's date range
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's user registrations
    const newUsers = await User.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get today's pomodoros
    const todayPomodoros = await Pomodoro.countDocuments({
      completed: true,
      endTime: { $gte: today, $lt: tomorrow }
    });

    // Get today's total pomodoro duration
    const pomodoroStats = await Pomodoro.aggregate([
      {
        $match: {
          completed: true,
          endTime: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalPomodoroMinutes = pomodoroStats.length > 0 ? pomodoroStats[0].totalDuration : 0;

    // Get today's new projects
    const newProjects = await Project.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get today's completed projects
    const completedProjects = await Project.countDocuments({
      status: 'completed',
      updatedAt: { $gte: today, $lt: tomorrow }
    });

    // Get today's new tasks
    const newTasks = await Task.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get today's completed tasks
    const completedTasks = await Task.countDocuments({
      completed: true,
      updatedAt: { $gte: today, $lt: tomorrow }
    });

    // Get active users today (users who completed at least one pomodoro today)
    const activeUsers = await Pomodoro.aggregate([
      {
        $match: {
          completed: true,
          endTime: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$user'
        }
      },
      {
        $count: 'count'
      }
    ]);

    const activeUserCount = activeUsers.length > 0 ? activeUsers[0].count : 0;

    res.json({
      date: today.toISOString().split('T')[0],
      newUsers,
      activeUsers: activeUserCount,
      pomodoros: {
        count: todayPomodoros,
        totalMinutes: totalPomodoroMinutes
      },
      projects: {
        new: newProjects,
        completed: completedProjects
      },
      tasks: {
        new: newTasks,
        completed: completedTasks
      }
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get quick stats for admin dashboard
 */
exports.getQuickStats = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get new users in the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newUsers = await User.countDocuments({ createdAt: { $gte: lastWeek } });

    // Get total pomodoros, projects, and tasks
    const Task = require('../models/Task');
    const Project = require('../models/Project');
    const Pomodoro = require('../models/Pomodoro');

    const totalPomodoros = await Pomodoro.countDocuments({ completed: true });
    const newPomodoros = await Pomodoro.countDocuments({
      completed: true,
      endTime: { $gte: lastWeek }
    });

    const totalProjects = await Project.countDocuments();
    const newProjects = await Project.countDocuments({ createdAt: { $gte: lastWeek } });

    res.json({
      totalUsers,
      newUsers,
      totalPomodoros,
      newPomodoros,
      totalProjects,
      newProjects
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get users with pagination and filters
 */
exports.getUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      direction = 'desc',
      status,
      search
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.isActive = status === 'active';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = direction === 'desc' ? -1 : 1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user status (enable/disable)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};