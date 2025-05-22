/**
 * Application Configuration
 */

const dotenv = require('dotenv');
dotenv.config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // Database configuration
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 27017,
    name: process.env.DB_NAME || 'pomodoro',
    username: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pomodoro'
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'YOUR_JWT_SECRET_PLEASE_CHANGE', // It is crucial to set a strong, unique secret in your .env file
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'noreply@pomodoro-app.com'
  },
  
  // Backup configuration
  backup: {
    enableAutoBackup: process.env.ENABLE_AUTO_BACKUP === 'true' || false,
    backupFrequency: process.env.BACKUP_FREQUENCY || 'daily', // hourly, daily, weekly, monthly
    maxBackups: parseInt(process.env.MAX_BACKUPS || 10, 10),
    backupDir: process.env.BACKUP_DIR || 'backups'
  }
};

module.exports = config;
