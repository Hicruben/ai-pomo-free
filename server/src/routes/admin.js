/**
 * Admin Routes
 *
 * Routes for admin functionality including subscription management
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const backupController = require('../controllers/backupController');
const auth = require('../middleware/auth');

// Admin middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Unauthorized: Admin access required' });
  }
  next();
};



// @route   GET /api/admin/stats/quick
// @desc    Get quick stats for admin dashboard
// @access  Admin
router.get(
  '/stats/quick',
  auth.authenticateJWT,
  isAdmin,
  adminController.getQuickStats
);

// @route   GET /api/admin/stats/today
// @desc    Get today's stats for admin dashboard
// @access  Admin
router.get(
  '/stats/today',
  auth.authenticateJWT,
  isAdmin,
  adminController.getTodayStats
);

// @route   GET /api/admin/stats
// @desc    Get detailed stats for admin dashboard
// @access  Admin
router.get(
  '/stats',
  auth.authenticateJWT,
  isAdmin,
  adminController.getStats
);

// @route   GET /api/admin/users
// @desc    Get users with pagination and filters
// @access  Admin
router.get(
  '/users',
  auth.authenticateJWT,
  isAdmin,
  adminController.getUsers
);

// @route   GET /api/admin/users/:userId/stats
// @desc    Get user stats
// @access  Admin
router.get(
  '/users/:userId/stats',
  auth.authenticateJWT,
  isAdmin,
  adminController.getUserStats
);

// @route   GET /api/admin/users/:userId/payments
// @desc    Get user payment history
// @access  Admin
router.get(
  '/users/:userId/payments',
  auth.authenticateJWT,
  isAdmin,
  adminController.getUserPaymentHistory
);

// @route   PUT /api/admin/users/:userId
// @desc    Update user
// @access  Admin
router.put(
  '/users/:userId',
  auth.authenticateJWT,
  isAdmin,
  adminController.updateUser
);

// @route   PUT /api/admin/users/:userId/status
// @desc    Update user status (enable/disable)
// @access  Admin
router.put(
  '/users/:userId/status',
  auth.authenticateJWT,
  isAdmin,
  adminController.updateUserStatus
);



// @route   POST /api/admin/users/:userId/reset-password
// @desc    Reset user password
// @access  Admin
router.post(
  '/users/:userId/reset-password',
  auth.authenticateJWT,
  isAdmin,
  adminController.resetUserPassword
);

// @route   POST /api/admin/users/:userId/message
// @desc    Send message to user
// @access  Admin
router.post(
  '/users/:userId/message',
  auth.authenticateJWT,
  isAdmin,
  adminController.sendUserMessage
);

// @route   DELETE /api/admin/users/:userId
// @desc    Delete user
// @access  Admin
router.delete(
  '/users/:userId',
  auth.authenticateJWT,
  isAdmin,
  adminController.deleteUser
);

// Database Backup Routes

// @route   POST /api/admin/backups
// @desc    Create a new database backup
// @access  Admin
router.post(
  '/backups',
  auth.authenticateJWT,
  isAdmin,
  backupController.createBackup
);

// @route   GET /api/admin/backups
// @desc    Get all database backups
// @access  Admin
router.get(
  '/backups',
  auth.authenticateJWT,
  isAdmin,
  backupController.getBackups
);

// @route   GET /api/admin/backups/:id/download
// @desc    Download a database backup
// @access  Admin
router.get(
  '/backups/:id/download',
  auth.authenticateJWT,
  isAdmin,
  backupController.downloadBackup
);

// @route   DELETE /api/admin/backups/:id
// @desc    Delete a database backup
// @access  Admin
router.delete(
  '/backups/:id',
  auth.authenticateJWT,
  isAdmin,
  backupController.deleteBackup
);

// @route   POST /api/admin/backups/:id/restore
// @desc    Restore a database backup
// @access  Admin
router.post(
  '/backups/:id/restore',
  auth.authenticateJWT,
  isAdmin,
  backupController.restoreBackup
);

// @route   PUT /api/admin/backups/settings
// @desc    Update backup settings
// @access  Admin
router.put(
  '/backups/settings',
  auth.authenticateJWT,
  isAdmin,
  backupController.updateBackupSettings
);

module.exports = router;
