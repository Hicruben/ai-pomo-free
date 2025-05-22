/**
 * Database Backup Controller
 * Handles database backup operations for admin users
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const mongoose = require('mongoose');
const cron = require('node-cron');
const config = require('../config/config');
const dockerBackup = require('../utils/dockerBackup');
const jsonBackup = require('../utils/jsonBackup');

// Models
const Backup = require('../models/Backup');

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Check if MongoDB Tools are installed
 * @returns {Promise<boolean>} True if MongoDB Tools are installed
 */
async function checkMongoDBTools() {
  try {
    console.log('Checking if MongoDB Tools are installed...');
    const whichCmd = process.platform === 'win32' ? 'where mongodump' : 'which mongodump';

    try {
      const { stdout } = await execPromise(whichCmd);
      console.log(`MongoDB Tools found at: ${stdout.trim()}`);
      return true;
    } catch (error) {
      console.error(`MongoDB Tools not found: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking MongoDB Tools: ${error.message}`);
    return false;
  }
}

/**
 * Test MongoDB connection
 * @param {string} connectionString - MongoDB connection string
 * @returns {Promise<boolean>} True if connection successful
 */
async function testMongoConnection(connectionString) {
  try {
    console.log(`Testing MongoDB connection to: ${connectionString}`);

    // Create a temporary connection
    const tempConnection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });

    // Close the connection
    await tempConnection.close();
    console.log('MongoDB connection test successful');
    return true;
  } catch (error) {
    console.error(`MongoDB connection test failed: ${error.message}`);
    return false;
  }
}

/**
 * Create a database backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createBackup = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { description } = req.body;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFileName = `backup-${timestamp}.gz`;
    const backupPath = path.join(backupDir, backupFileName);

    // Get database connection string from mongoose
    const { host, port, name, username, password } = config.db;
    const authPart = username && password ? `${username}:${password}@` : '';
    const connectionString = `mongodb://${authPart}${host}:${port}/${name}`;

    // Test MongoDB connection
    const isConnected = await testMongoConnection(connectionString);
    if (!isConnected) {
      return res.status(500).json({
        message: 'Failed to create backup: Cannot connect to MongoDB',
        details: 'The application cannot connect to the MongoDB database. Please check your database connection settings.'
      });
    }

    // Check if MongoDB Tools are installed
    const toolsInstalled = await checkMongoDBTools();
    console.log(`MongoDB Tools installed: ${toolsInstalled}`);

    // If tools are not installed, try Docker method directly
    if (!toolsInstalled) {
      console.log('MongoDB Tools not installed, trying Docker backup method...');
      try {
        // Check if Docker is available
        const isDockerAvailable = await dockerBackup.isDockerAvailable();
        if (!isDockerAvailable) {
          return res.status(500).json({
            message: 'Failed to create backup: MongoDB Tools not installed and Docker is not available',
            details: 'The mongodump utility is required for database backups. Please ensure MongoDB Database Tools are installed on the server and added to your system PATH, or ensure Docker is available if using MongoDB in a container.',
            installationGuide: {
              windows: 'Download from mongodb.com/try/download/database-tools, extract, and add bin directory to PATH',
              mac: 'Install using: brew install mongodb-database-tools',
              linux: 'Install using: sudo apt-get install mongodb-database-tools (Ubuntu/Debian) or sudo yum install mongodb-database-tools (RHEL/CentOS)'
            }
          });
        }

        // Check if MongoDB container is running
        const isMongoContainerRunning = await dockerBackup.isMongoContainerRunning();
        if (!isMongoContainerRunning) {
          return res.status(500).json({
            message: 'Failed to create backup: MongoDB container is not running',
            details: 'The MongoDB container must be running to create a backup. Please ensure your MongoDB container is running and properly configured.',
          });
        }

        // Create backup using Docker
        console.log('Creating backup using Docker...');
        const backupResult = await dockerBackup.createBackupWithDocker(backupPath, description || `Manual backup created on ${new Date().toLocaleString()}`);

        // Create backup record in database
        const backup = new Backup({
          fileName: backupFileName,
          filePath: backupResult.filePath,
          fileSize: backupResult.fileSize,
          description: backupResult.description,
          createdBy: req.user._id,
          type: 'manual'
        });

        await backup.save();

        const fileSizeInMB = (backupResult.fileSize / (1024 * 1024)).toFixed(2);

        return res.status(201).json({
          message: 'Backup created successfully using Docker',
          backup: {
            id: backup._id,
            fileName: backup.fileName,
            description: backup.description,
            createdAt: backup.createdAt,
            fileSize: `${fileSizeInMB} MB`,
            type: backup.type
          }
        });
      } catch (dockerError) {
        console.error('Error creating backup with Docker:', dockerError);

        // Try JSON backup method as a last resort
        try {
          console.log('Attempting JSON backup method as fallback...');
          const backupResult = await jsonBackup.createJsonBackup(backupPath, description || `Manual backup created on ${new Date().toLocaleString()}`);

          // Create backup record in database
          const backup = new Backup({
            fileName: backupFileName,
            filePath: backupResult.filePath,
            fileSize: backupResult.fileSize,
            description: backupResult.description,
            createdBy: req.user._id,
            type: 'manual'
          });

          await backup.save();

          const fileSizeInMB = (backupResult.fileSize / (1024 * 1024)).toFixed(2);

          return res.status(201).json({
            message: 'Backup created successfully using JSON export (fallback method)',
            backup: {
              id: backup._id,
              fileName: backup.fileName,
              description: backup.description,
              createdAt: backup.createdAt,
              fileSize: `${fileSizeInMB} MB`,
              type: backup.type
            }
          });
        } catch (jsonError) {
          console.error('Error creating backup with JSON method:', jsonError);
          return res.status(500).json({
            message: 'Failed to create backup: All backup methods failed',
            details: 'The system attempted to use MongoDB Tools, Docker, and JSON export methods, but all failed.',
            errors: {
              mongoTools: 'MongoDB Tools not installed or not in PATH',
              docker: dockerError.message,
              jsonExport: jsonError.message
            },
            installationGuide: {
              windows: 'Download from mongodb.com/try/download/database-tools, extract, and add bin directory to PATH',
              mac: 'Install using: brew install mongodb-database-tools',
              linux: 'Install using: sudo apt-get install mongodb-database-tools (Ubuntu/Debian) or sudo yum install mongodb-database-tools (RHEL/CentOS)'
            }
          });
        }
      }
    }

    try {
      // Create backup using mongodump
      console.log(`Executing mongodump command for manual backup...`);
      const cmd = `mongodump --uri="${connectionString}" --archive="${backupPath}" --gzip`;
      console.log(`Command: ${cmd}`);

      try {
        // First, check if mongodump is available
        console.log('Checking if mongodump is available...');
        const whichCmd = process.platform === 'win32' ? 'where mongodump' : 'which mongodump';
        const { stdout: whichOutput, stderr: whichError } = await execPromise(whichCmd);
        console.log(`mongodump path: ${whichOutput.trim()}`);
      } catch (whichError) {
        console.error(`mongodump not found in PATH: ${whichError.message}`);
      }

      // Execute the actual backup command
      const { stdout, stderr } = await execPromise(cmd);
      console.log(`Mongodump stdout: ${stdout}`);
      if (stderr) {
        console.log(`Mongodump stderr: ${stderr}`);
      }
      console.log(`Mongodump completed successfully`);

      // Get file size
      const stats = fs.statSync(backupPath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

      // Create backup record in database
      const backup = new Backup({
        fileName: backupFileName,
        filePath: backupPath,
        fileSize: fileSizeInBytes,
        description: description || `Manual backup created on ${new Date().toLocaleString()}`,
        createdBy: req.user._id,
        type: 'manual'
      });

      await backup.save();

      res.status(201).json({
        message: 'Backup created successfully',
        backup: {
          id: backup._id,
          fileName: backup.fileName,
          description: backup.description,
          createdAt: backup.createdAt,
          fileSize: `${fileSizeInMB} MB`,
          type: backup.type
        }
      });
    } catch (execError) {
      console.error('Error executing mongodump command:', execError);

      // Check if it's a command not found error
      if (execError.message && (execError.message.includes('not recognized') ||
                               execError.message.includes('not found') ||
                               execError.message.includes('command not found') ||
                               execError.message.includes('No such file or directory'))) {
        console.log('mongodump not found, trying Docker backup method...');

        // Try using Docker backup method
        try {
          // Check if Docker is available
          const isDockerAvailable = await dockerBackup.isDockerAvailable();
          if (!isDockerAvailable) {
            return res.status(500).json({
              message: 'Failed to create backup: mongodump command not found and Docker is not available',
              details: 'The mongodump utility is required for database backups. Please ensure MongoDB Database Tools are installed on the server and added to your system PATH, or ensure Docker is available if using MongoDB in a container.',
              installationGuide: {
                windows: 'Download from mongodb.com/try/download/database-tools, extract, and add bin directory to PATH',
                mac: 'Install using: brew install mongodb-database-tools',
                linux: 'Install using: sudo apt-get install mongodb-database-tools (Ubuntu/Debian) or sudo yum install mongodb-database-tools (RHEL/CentOS)'
              }
            });
          }

          // Check if MongoDB container is running
          const isMongoContainerRunning = await dockerBackup.isMongoContainerRunning();
          if (!isMongoContainerRunning) {
            return res.status(500).json({
              message: 'Failed to create backup: MongoDB container is not running',
              details: 'The MongoDB container must be running to create a backup. Please ensure your MongoDB container is running and properly configured.',
            });
          }

          // Create backup using Docker
          console.log('Creating backup using Docker...');
          const backupResult = await dockerBackup.createBackupWithDocker(backupPath, description || `Manual backup created on ${new Date().toLocaleString()}`);

          // Create backup record in database
          const backup = new Backup({
            fileName: backupFileName,
            filePath: backupResult.filePath,
            fileSize: backupResult.fileSize,
            description: backupResult.description,
            createdBy: req.user._id,
            type: 'manual'
          });

          await backup.save();

          const fileSizeInMB = (backupResult.fileSize / (1024 * 1024)).toFixed(2);

          return res.status(201).json({
            message: 'Backup created successfully using Docker',
            backup: {
              id: backup._id,
              fileName: backup.fileName,
              description: backup.description,
              createdAt: backup.createdAt,
              fileSize: `${fileSizeInMB} MB`,
              type: backup.type
            }
          });
        } catch (dockerError) {
          console.error('Error creating backup with Docker:', dockerError);

          // Try JSON backup method as a last resort
          try {
            console.log('Attempting JSON backup method as fallback...');
            const backupResult = await jsonBackup.createJsonBackup(backupPath, description || `Manual backup created on ${new Date().toLocaleString()}`);

            // Create backup record in database
            const backup = new Backup({
              fileName: backupFileName,
              filePath: backupResult.filePath,
              fileSize: backupResult.fileSize,
              description: backupResult.description,
              createdBy: req.user._id,
              type: 'manual'
            });

            await backup.save();

            const fileSizeInMB = (backupResult.fileSize / (1024 * 1024)).toFixed(2);

            return res.status(201).json({
              message: 'Backup created successfully using JSON export (fallback method)',
              backup: {
                id: backup._id,
                fileName: backup.fileName,
                description: backup.description,
                createdAt: backup.createdAt,
                fileSize: `${fileSizeInMB} MB`,
                type: backup.type
              }
            });
          } catch (jsonError) {
            console.error('Error creating backup with JSON method:', jsonError);
            return res.status(500).json({
              message: 'Failed to create backup: All backup methods failed',
              details: 'The system attempted to use MongoDB Tools, Docker, and JSON export methods, but all failed.',
              errors: {
                mongoTools: 'MongoDB Tools not installed or not in PATH',
                docker: dockerError.message,
                jsonExport: jsonError.message
              },
              installationGuide: {
                windows: 'Download from mongodb.com/try/download/database-tools, extract, and add bin directory to PATH',
                mac: 'Install using: brew install mongodb-database-tools',
                linux: 'Install using: sudo apt-get install mongodb-database-tools (Ubuntu/Debian) or sudo yum install mongodb-database-tools (RHEL/CentOS)'
              }
            });
          }
        }
      }

      res.status(500).json({
        message: 'Failed to create backup',
        error: execError.message,
        details: 'There was an error executing the mongodump command. Please check server logs for more information.'
      });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
};

/**
 * Get all backups
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBackups = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const backups = await Backup.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    const formattedBackups = backups.map(backup => {
      const fileSizeInMB = (backup.fileSize / (1024 * 1024)).toFixed(2);
      return {
        id: backup._id,
        fileName: backup.fileName,
        description: backup.description,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy ? {
          id: backup.createdBy._id,
          name: backup.createdBy.name,
          email: backup.createdBy.email
        } : null,
        fileSize: `${fileSizeInMB} MB`,
        type: backup.type
      };
    });

    res.json(formattedBackups);
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ message: 'Failed to fetch backups', error: error.message });
  }
};

/**
 * Download a backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.downloadBackup = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { id } = req.params;
    const backup = await Backup.findById(id);

    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    // Check if file exists
    if (!fs.existsSync(backup.filePath)) {
      return res.status(404).json({ message: 'Backup file not found on server' });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=${backup.fileName}`);
    res.setHeader('Content-Type', 'application/gzip');

    // Stream the file
    const fileStream = fs.createReadStream(backup.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ message: 'Failed to download backup', error: error.message });
  }
};

/**
 * Delete a backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteBackup = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { id } = req.params;
    const backup = await Backup.findById(id);

    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    // Delete file if it exists
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    // Delete backup record
    await Backup.findByIdAndDelete(id);

    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ message: 'Failed to delete backup', error: error.message });
  }
};

/**
 * Restore a backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.restoreBackup = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { id } = req.params;
    const backup = await Backup.findById(id);

    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    // Check if file exists
    if (!fs.existsSync(backup.filePath)) {
      return res.status(404).json({ message: 'Backup file not found on server' });
    }

    // Get database connection string from mongoose
    const { host, port, name, username, password } = config.db;
    const authPart = username && password ? `${username}:${password}@` : '';
    const connectionString = `mongodb://${authPart}${host}:${port}/${name}`;

    try {
      // Restore backup using mongorestore
      console.log(`Executing mongorestore command...`);
      const cmd = `mongorestore --uri="${connectionString}" --gzip --archive="${backup.filePath}" --drop`;

      await execPromise(cmd);
      console.log(`Mongorestore completed successfully`);

      res.json({ message: 'Backup restored successfully' });
    } catch (execError) {
      console.error('Error executing mongorestore command:', execError);

      // Check if it's a command not found error
      if (execError.message && (execError.message.includes('not recognized') ||
                               execError.message.includes('not found') ||
                               execError.message.includes('command not found') ||
                               execError.message.includes('No such file or directory'))) {
        console.log('mongorestore not found, trying Docker restore method...');

        // Try using Docker restore method
        try {
          // Check if Docker is available
          const isDockerAvailable = await dockerBackup.isDockerAvailable();
          if (!isDockerAvailable) {
            return res.status(500).json({
              message: 'Failed to restore backup: mongorestore command not found and Docker is not available',
              details: 'The mongorestore utility is required for database restores. Please ensure MongoDB Database Tools are installed on the server and added to your system PATH, or ensure Docker is available if using MongoDB in a container.',
              installationGuide: {
                windows: 'Download from mongodb.com/try/download/database-tools, extract, and add bin directory to PATH',
                mac: 'Install using: brew install mongodb-database-tools',
                linux: 'Install using: sudo apt-get install mongodb-database-tools (Ubuntu/Debian) or sudo yum install mongodb-database-tools (RHEL/CentOS)'
              }
            });
          }

          // Check if MongoDB container is running
          const isMongoContainerRunning = await dockerBackup.isMongoContainerRunning();
          if (!isMongoContainerRunning) {
            return res.status(500).json({
              message: 'Failed to restore backup: MongoDB container is not running',
              details: 'The MongoDB container must be running to restore a backup. Please ensure your MongoDB container is running and properly configured.',
            });
          }

          // Restore backup using Docker
          console.log('Restoring backup using Docker...');
          await dockerBackup.restoreBackupWithDocker(backup.filePath);

          return res.json({ message: 'Backup restored successfully using Docker' });
        } catch (dockerError) {
          console.error('Error restoring backup with Docker:', dockerError);

          // Try JSON backup method as a last resort
          try {
            console.log('Attempting JSON backup restore method as fallback...');

            // Check if the backup file has a .gz extension (likely a mongodump backup)
            if (backup.filePath.endsWith('.gz')) {
              console.log('Backup appears to be in mongodump format, attempting to restore with JSON method...');

              // Try to restore using JSON method
              await jsonBackup.restoreJsonBackup(backup.filePath);

              return res.json({
                message: 'Backup restored successfully using JSON method (fallback)',
                note: 'The backup was restored using a fallback method which may not restore all data perfectly. Please verify your data.'
              });
            } else {
              throw new Error('Backup file is not in a format that can be restored by the JSON fallback method');
            }
          } catch (jsonError) {
            console.error('Error restoring backup with JSON method:', jsonError);
            return res.status(500).json({
              message: 'Failed to restore backup: All restore methods failed',
              details: 'The system attempted to use MongoDB Tools, Docker, and JSON import methods, but all failed.',
              errors: {
                mongoTools: 'MongoDB Tools not installed or not in PATH',
                docker: dockerError.message,
                jsonImport: jsonError.message
              },
              installationGuide: {
                windows: 'Download from mongodb.com/try/download/database-tools, extract, and add bin directory to PATH',
                mac: 'Install using: brew install mongodb-database-tools',
                linux: 'Install using: sudo apt-get install mongodb-database-tools (Ubuntu/Debian) or sudo yum install mongodb-database-tools (RHEL/CentOS)'
              }
            });
          }
        }
      }

      res.status(500).json({
        message: 'Failed to restore backup',
        error: execError.message,
        details: 'There was an error executing the mongorestore command. Please check server logs for more information.'
      });
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ message: 'Failed to restore backup', error: error.message });
  }
};

/**
 * Update backup settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateBackupSettings = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { enableAutoBackup, backupFrequency, maxBackups } = req.body;

    // Update settings in config
    config.backup = {
      ...config.backup,
      enableAutoBackup: enableAutoBackup !== undefined ? enableAutoBackup : config.backup.enableAutoBackup,
      backupFrequency: backupFrequency || config.backup.backupFrequency,
      maxBackups: maxBackups || config.backup.maxBackups
    };

    // Save settings to database or config file
    // This depends on how you're storing configuration

    // Restart auto backup scheduler if needed
    if (enableAutoBackup) {
      setupAutoBackupScheduler();
    }

    res.json({
      message: 'Backup settings updated successfully',
      settings: config.backup
    });
  } catch (error) {
    console.error('Error updating backup settings:', error);
    res.status(500).json({ message: 'Failed to update backup settings', error: error.message });
  }
};

/**
 * Setup automatic backup scheduler
 */
function setupAutoBackupScheduler() {
  try {
    // Clear existing scheduled tasks
    if (global.backupScheduler) {
      global.backupScheduler.stop();
    }

    // Schedule new backup task
    if (config.backup && config.backup.enableAutoBackup) {
      const cronExpression = getCronExpression(config.backup.backupFrequency);

      global.backupScheduler = cron.schedule(cronExpression, async () => {
        try {
          console.log('Running scheduled backup...');

          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const backupFileName = `auto-backup-${timestamp}.gz`;
          const backupPath = path.join(backupDir, backupFileName);

          // Get database connection string
          const { host, port, name, username, password } = config.db;
          const authPart = username && password ? `${username}:${password}@` : '';
          const connectionString = `mongodb://${authPart}${host}:${port}/${name}`;

          try {
            // Create backup
            const cmd = `mongodump --uri="${connectionString}" --archive="${backupPath}" --gzip`;
            await execPromise(cmd);

            // Get file size
            const stats = fs.statSync(backupPath);
            const fileSizeInBytes = stats.size;

            // Create backup record
            const backup = new Backup({
              fileName: backupFileName,
              filePath: backupPath,
              fileSize: fileSizeInBytes,
              description: `Automatic backup created on ${new Date().toLocaleString()}`,
              type: 'automatic'
            });

            await backup.save();

            // Delete old backups if exceeding maxBackups
            if (config.backup.maxBackups > 0) {
              const oldBackups = await Backup.find({ type: 'automatic' })
                .sort({ createdAt: -1 })
                .skip(config.backup.maxBackups);

              for (const oldBackup of oldBackups) {
                if (fs.existsSync(oldBackup.filePath)) {
                  fs.unlinkSync(oldBackup.filePath);
                }
                await Backup.findByIdAndDelete(oldBackup._id);
              }
            }

            console.log('Scheduled backup completed successfully');
          } catch (execError) {
            console.error('Error executing mongodump command:', execError);
            console.log('Automatic backup failed - mongodump may not be installed or accessible');
          }
        } catch (error) {
          console.error('Error during scheduled backup:', error);
        }
      });

      console.log(`Automatic backup scheduler set up with frequency: ${config.backup.backupFrequency}`);
    } else {
      console.log('Automatic backup is disabled in configuration');
    }
  } catch (error) {
    console.error('Error setting up backup scheduler:', error);
  }
}

/**
 * Get cron expression from backup frequency
 * @param {string} frequency - Backup frequency (daily, weekly, monthly)
 * @returns {string} Cron expression
 */
function getCronExpression(frequency) {
  switch (frequency) {
    case 'hourly':
      return '0 * * * *'; // Every hour at minute 0
    case 'daily':
      return '0 0 * * *'; // Every day at midnight
    case 'weekly':
      return '0 0 * * 0'; // Every Sunday at midnight
    case 'monthly':
      return '0 0 1 * *'; // 1st day of month at midnight
    default:
      return '0 0 * * *'; // Default to daily
  }
}

// Initialize auto backup scheduler if enabled in config
try {
  if (config.backup && config.backup.enableAutoBackup) {
    console.log('Initializing automatic backup scheduler...');
    setupAutoBackupScheduler();
  } else {
    console.log('Automatic backup is disabled in configuration');
  }
} catch (error) {
  console.error('Error initializing automatic backup scheduler:', error);
}

module.exports = exports;
