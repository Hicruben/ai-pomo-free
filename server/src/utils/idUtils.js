/**
 * Utility functions for handling MongoDB ObjectIds
 */

const mongoose = require('mongoose');

/**
 * Safely converts a value to a valid MongoDB ObjectId string
 *
 * @param {*} id - The ID to convert (can be an ObjectId, string, or object with _id/id property)
 * @returns {string|null} - The string representation of the ID, or null if invalid
 */
exports.safeObjectId = (id) => {
  if (!id) return null;

  try {
    // If id is already an ObjectId, convert to string
    if (mongoose.Types.ObjectId.isValid(id)) {
      return id.toString();
    }

    // If id is an object with _id or id property
    if (typeof id === 'object') {
      // Check for _id property
      if (id._id && mongoose.Types.ObjectId.isValid(id._id)) {
        return id._id.toString();
      }

      // Check for id property
      if (id.id && mongoose.Types.ObjectId.isValid(id.id)) {
        return id.id.toString();
      }

      // If the object itself is stringified, try parsing it
      try {
        const idStr = id.toString();
        if (idStr !== '[object Object]' && mongoose.Types.ObjectId.isValid(idStr)) {
          return idStr;
        }
      } catch (err) {
        // Ignore toString errors
      }
    }

    // If id is a string that's a valid ObjectId
    if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
      return id;
    }

    // If we get here, the ID is not valid
    console.warn(`Invalid ObjectId: ${id}`);
    return null;
  } catch (error) {
    console.error('Error in safeObjectId:', error);
    return null;
  }
};

/**
 * Safely converts a value to a MongoDB ObjectId
 *
 * @param {*} id - The ID to convert
 * @returns {ObjectId|null} - The MongoDB ObjectId, or null if invalid
 */
exports.toObjectId = (id) => {
  // If already an ObjectId instance, return it
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }

  // Get the string representation
  const safeId = exports.safeObjectId(id);
  if (!safeId) return null;

  try {
    return new mongoose.Types.ObjectId(safeId);
  } catch (error) {
    console.error('Error converting to ObjectId:', error);
    return null;
  }
};
