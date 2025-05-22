/**
 * JSON Backup Utilities
 *
 * This module provides functions to create and restore MongoDB backups
 * using direct JSON export/import when MongoDB Tools and Docker are not available.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Create a backup by exporting all collections to JSON
 * @param {string} backupPath - Path where the backup will be saved
 * @param {string} description - Backup description
 * @returns {Promise<Object>} Backup information
 */
async function createJsonBackup(backupPath, description) {
  try {
    console.log(`Creating JSON backup to ${backupPath}...`);
    
    // Get all collections
    const collections = mongoose.connection.collections;
    const collectionNames = Object.keys(collections);
    
    if (collectionNames.length === 0) {
      throw new Error('No collections found in the database');
    }
    
    console.log(`Found ${collectionNames.length} collections: ${collectionNames.join(', ')}`);
    
    // Create a backup object with all collections
    const backup = {
      metadata: {
        createdAt: new Date(),
        description: description || `JSON backup created on ${new Date().toLocaleString()}`,
        collections: collectionNames
      },
      data: {}
    };
    
    // Export each collection
    for (const collectionName of collectionNames) {
      console.log(`Exporting collection: ${collectionName}`);
      const collection = collections[collectionName];
      const documents = await collection.find({}).toArray();
      backup.data[collectionName] = documents;
      console.log(`Exported ${documents.length} documents from ${collectionName}`);
    }
    
    // Convert to JSON and compress
    const jsonData = JSON.stringify(backup);
    console.log(`JSON data size: ${(jsonData.length / 1024).toFixed(2)} KB`);
    
    // Compress the data
    const compressedData = await gzip(jsonData);
    console.log(`Compressed data size: ${(compressedData.length / 1024).toFixed(2)} KB`);
    
    // Write to file
    fs.writeFileSync(backupPath, compressedData);
    
    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeInBytes = stats.size;
    
    console.log(`Backup file created at ${backupPath} (${(fileSizeInBytes / 1024).toFixed(2)} KB)`);
    
    return {
      filePath: backupPath,
      fileSize: fileSizeInBytes,
      description: description || `JSON backup created on ${new Date().toLocaleString()}`
    };
  } catch (error) {
    console.error(`Error creating JSON backup: ${error.message}`);
    throw error;
  }
}

/**
 * Restore a backup from JSON
 * @param {string} backupPath - Path to the backup file
 * @returns {Promise<void>}
 */
async function restoreJsonBackup(backupPath) {
  try {
    console.log(`Restoring JSON backup from ${backupPath}...`);
    
    // Check if backup file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Read and decompress the file
    const compressedData = fs.readFileSync(backupPath);
    const jsonData = await gunzip(compressedData);
    const backup = JSON.parse(jsonData.toString());
    
    // Validate backup format
    if (!backup.metadata || !backup.data) {
      throw new Error('Invalid backup format');
    }
    
    console.log(`Backup created on: ${new Date(backup.metadata.createdAt).toLocaleString()}`);
    console.log(`Collections to restore: ${backup.metadata.collections.join(', ')}`);
    
    // Restore each collection
    for (const collectionName of backup.metadata.collections) {
      if (!backup.data[collectionName]) {
        console.warn(`Collection ${collectionName} not found in backup data, skipping`);
        continue;
      }
      
      const documents = backup.data[collectionName];
      console.log(`Restoring ${documents.length} documents to ${collectionName}`);
      
      // Get the collection
      const collection = mongoose.connection.collection(collectionName);
      
      // Drop the collection first
      try {
        await collection.drop();
        console.log(`Dropped collection: ${collectionName}`);
      } catch (dropError) {
        console.log(`Collection ${collectionName} does not exist or could not be dropped: ${dropError.message}`);
      }
      
      // Insert the documents if there are any
      if (documents.length > 0) {
        await collection.insertMany(documents);
        console.log(`Restored ${documents.length} documents to ${collectionName}`);
      }
    }
    
    console.log(`Restore completed successfully`);
    return { message: 'Backup restored successfully using JSON method' };
  } catch (error) {
    console.error(`Error restoring JSON backup: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createJsonBackup,
  restoreJsonBackup
};
