/**
 * Backup Model
 * Stores information about database backups
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BackupSchema = new Schema({
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual'
  }
});

module.exports = mongoose.model('Backup', BackupSchema);
