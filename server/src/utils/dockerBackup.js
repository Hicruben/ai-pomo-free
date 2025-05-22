/**
 * Docker MongoDB Backup Utilities
 *
 * This module provides functions to create and restore MongoDB backups
 * when MongoDB is running in a Docker container.
 */

const { exec, execSync } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execPromise = util.promisify(exec);

// Configuration
const MONGODB_CONTAINER_NAME = process.env.MONGODB_CONTAINER_NAME || 'pomodoro-mongodb';
const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost';
const MONGODB_PORT = process.env.MONGODB_PORT || '27017';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'pomodoro-timer';
const MONGODB_USERNAME = process.env.MONGODB_USERNAME || 'admin';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || 'password';

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Check if Docker is installed and accessible
 * @returns {Promise<boolean>} True if Docker is available
 */
async function isDockerAvailable() {
  try {
    console.log('Checking if Docker is available...');
    const { stdout } = await execPromise('docker --version');
    console.log(`Docker version: ${stdout.trim()}`);

    // Also check if Docker daemon is running
    console.log('Checking if Docker daemon is running...');
    await execPromise('docker info');
    console.log('Docker daemon is running');

    return true;
  } catch (error) {
    console.error('Docker is not available or not running:', error.message);

    // Provide more specific error message based on the error
    if (error.message.includes('not recognized') || error.message.includes('not found')) {
      console.error('Docker is not installed on this system');
    } else if (error.message.includes('Cannot connect') || error.message.includes('daemon')) {
      console.error('Docker daemon is not running');
    }

    return false;
  }
}

/**
 * Check if the MongoDB container exists and is running
 * @returns {Promise<boolean>} True if the container is running
 */
async function isMongoContainerRunning() {
  try {
    console.log(`Checking if MongoDB container '${MONGODB_CONTAINER_NAME}' is running...`);

    // Use a more flexible approach to find the MongoDB container
    // This will match containers that contain the name, not just exact matches
    const { stdout } = await execPromise(`docker ps --filter "name=mongodb" --format "{{.Names}}"`);

    // Check if any container name contains our expected name
    const containerNames = stdout.trim().split('\n').filter(name => name);
    console.log(`Found containers matching 'mongodb': ${containerNames.join(', ') || 'none'}`);

    // If we found any container with mongodb in the name, consider it as our MongoDB container
    // and update our container name variable
    if (containerNames.length > 0) {
      // Use the first matching container
      const foundContainer = containerNames[0];
      console.log(`Using MongoDB container: ${foundContainer}`);

      // Update the global container name for this session
      global.MONGODB_CONTAINER_NAME = foundContainer;

      return true;
    }

    console.log(`No running MongoDB container found`);

    // Try to get more information about all available containers
    try {
      const { stdout: allContainers } = await execPromise(`docker ps --format "{{.Names}}"`);
      const containerList = allContainers.trim().split('\n').filter(name => name);
      console.log(`All available containers: ${containerList.join(', ') || 'none'}`);
    } catch (listError) {
      console.error(`Error listing all containers: ${listError.message}`);
    }

    return false;
  } catch (error) {
    console.error('Error checking MongoDB container:', error.message);
    return false;
  }
}

/**
 * Create a backup using Docker exec and mongodump
 * @param {string} backupPath - Path where the backup will be saved
 * @param {string} description - Backup description
 * @returns {Promise<Object>} Backup information
 */
async function createBackupWithDocker(backupPath, description) {
  // Check if Docker is available
  if (!(await isDockerAvailable())) {
    throw new Error('Docker is not available on this system');
  }

  // Check if MongoDB container is running
  if (!(await isMongoContainerRunning())) {
    throw new Error(`MongoDB container '${MONGODB_CONTAINER_NAME}' is not running`);
  }

  // Create auth string if credentials are provided
  const authPart = MONGODB_USERNAME && MONGODB_PASSWORD
    ? `--username ${MONGODB_USERNAME} --password ${MONGODB_PASSWORD} --authenticationDatabase admin`
    : '';

  console.log(`Checking if container ${MONGODB_CONTAINER_NAME} exists...`);
  try {
    const { stdout: containerCheck } = await execPromise(`docker container inspect ${MONGODB_CONTAINER_NAME}`);
    console.log(`Container exists: ${containerCheck.length > 0}`);
  } catch (containerError) {
    console.error(`Error checking container: ${containerError.message}`);
    throw new Error(`MongoDB container '${MONGODB_CONTAINER_NAME}' does not exist or is not accessible`);
  }

  // Method 1: Direct output to file using redirection
  try {
    console.log(`Creating backup to ${backupPath}...`);

    // Use the global container name if it was updated by isMongoContainerRunning
    const containerName = global.MONGODB_CONTAINER_NAME || MONGODB_CONTAINER_NAME;
    console.log(`Using container name for backup: ${containerName}`);

    // Create the backup command with direct output to file
    const backupCommand = `docker exec ${containerName} mongodump --host ${MONGODB_HOST} --port ${MONGODB_PORT} ${authPart} --archive --gzip --db ${MONGODB_DATABASE} > "${backupPath}"`;

    console.log(`Executing backup command: ${backupCommand}`);

    // Use execSync to ensure the command completes before continuing
    execSync(backupCommand, {
      shell: true,
      stdio: 'inherit',
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer for large backups
    });

    console.log(`Backup completed successfully to ${backupPath}`);

    // Check if the file exists and has content
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file was not created at ${backupPath}`);
    }

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeInBytes = stats.size;

    if (fileSizeInBytes === 0) {
      throw new Error('Backup file was created but is empty');
    }

    console.log(`Backup file size: ${fileSizeInBytes} bytes`);

    return {
      filePath: backupPath,
      fileSize: fileSizeInBytes,
      description: description || `Docker backup created on ${new Date().toLocaleString()}`
    };
  } catch (error) {
    console.error(`Error creating backup: ${error.message}`);
    throw error;
  }
}

/**
 * Restore a backup using Docker exec and mongorestore
 * @param {string} backupPath - Path to the backup file
 * @returns {Promise<void>}
 */
async function restoreBackupWithDocker(backupPath) {
  // Check if Docker is available
  if (!(await isDockerAvailable())) {
    throw new Error('Docker is not available on this system');
  }

  // Check if MongoDB container is running
  if (!(await isMongoContainerRunning())) {
    throw new Error(`MongoDB container '${MONGODB_CONTAINER_NAME}' is not running`);
  }

  // Check if backup file exists
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  // Get file size to verify it's not empty
  const stats = fs.statSync(backupPath);
  if (stats.size === 0) {
    throw new Error(`Backup file is empty: ${backupPath}`);
  }

  // Create auth string if credentials are provided
  const authPart = MONGODB_USERNAME && MONGODB_PASSWORD
    ? `--username ${MONGODB_USERNAME} --password ${MONGODB_PASSWORD} --authenticationDatabase admin`
    : '';

  try {
    console.log(`Restoring backup from ${backupPath}...`);

    // Use the global container name if it was updated by isMongoContainerRunning
    const containerName = global.MONGODB_CONTAINER_NAME || MONGODB_CONTAINER_NAME;
    console.log(`Using container name for restore: ${containerName}`);

    // Create a temporary file in the container
    const containerTempFile = '/tmp/mongodb-backup.gz';

    // Copy the backup file to the container
    console.log(`Copying backup file to container: docker cp "${backupPath}" ${containerName}:${containerTempFile}`);
    await execPromise(`docker cp "${backupPath}" ${containerName}:${containerTempFile}`);

    // Verify the file was copied successfully
    console.log(`Verifying backup file in container...`);
    const { stdout: lsOutput } = await execPromise(`docker exec ${containerName} ls -la ${containerTempFile}`);
    console.log(`File in container: ${lsOutput}`);

    // Restore the backup
    const restoreCommand = `docker exec ${containerName} mongorestore --host ${MONGODB_HOST} --port ${MONGODB_PORT} ${authPart} --archive=${containerTempFile} --gzip --drop --db ${MONGODB_DATABASE}`;

    console.log(`Executing restore command: ${restoreCommand}`);

    const { stdout, stderr } = await execPromise(restoreCommand);
    if (stdout) console.log(`Restore stdout: ${stdout}`);
    if (stderr) console.log(`Restore stderr: ${stderr}`);

    console.log(`Restore completed successfully`);

    // Clean up the temporary file
    console.log(`Cleaning up temporary file in container...`);
    await execPromise(`docker exec ${containerName} rm ${containerTempFile}`);

    return { message: 'Backup restored successfully using Docker' };
  } catch (error) {
    console.error(`Error restoring backup: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createBackupWithDocker,
  restoreBackupWithDocker,
  isDockerAvailable,
  isMongoContainerRunning
};
