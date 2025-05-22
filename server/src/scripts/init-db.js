/**
 * MongoDB Database Initialization Script
 *
 * This script creates the necessary collections and indexes for the Pomodoro Timer application.
 * Run this script after setting up the MongoDB container to initialize the database.
 *
 * Usage:
 * node init-db.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pomodoro-timer';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    initializeDatabase();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Initialize database
async function initializeDatabase() {
  try {
    const db = mongoose.connection;

    // Create collections if they don't exist
    console.log('Creating collections...');

    // Users collection
    if (!(await collectionExists(db, 'users'))) {
      await db.createCollection('users');
      console.log('Created users collection');

      // Create indexes for users collection
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ googleId: 1 }, { sparse: true });
      console.log('Created indexes for users collection');
    } else {
      console.log('Users collection already exists');
    }

    // Projects collection
    if (!(await collectionExists(db, 'projects'))) {
      await db.createCollection('projects');
      console.log('Created projects collection');

      // Create indexes for projects collection
      await db.collection('projects').createIndex({ user: 1 });
      await db.collection('projects').createIndex({ status: 1, user: 1 });
      console.log('Created indexes for projects collection');
    } else {
      console.log('Projects collection already exists');
    }

    // Tasks collection
    if (!(await collectionExists(db, 'tasks'))) {
      await db.createCollection('tasks');
      console.log('Created tasks collection');

      // Create indexes for tasks collection
      await db.collection('tasks').createIndex({ user: 1 });
      await db.collection('tasks').createIndex({ project: 1 });
      await db.collection('tasks').createIndex({ todoistId: 1, user: 1 }, { sparse: true });
      console.log('Created indexes for tasks collection');
    } else {
      console.log('Tasks collection already exists');
    }

    // Pomodoros collection
    if (!(await collectionExists(db, 'pomodoros'))) {
      await db.createCollection('pomodoros');
      console.log('Created pomodoros collection');

      // Create indexes for pomodoros collection
      await db.collection('pomodoros').createIndex({ user: 1 });
      await db.collection('pomodoros').createIndex({ task: 1 }, { sparse: true });
      await db.collection('pomodoros').createIndex({ project: 1 }, { sparse: true });
      await db.collection('pomodoros').createIndex({ startTime: 1 });
      console.log('Created indexes for pomodoros collection');
    } else {
      console.log('Pomodoros collection already exists');
    }

    // Milestones collection
    if (!(await collectionExists(db, 'milestones'))) {
      await db.createCollection('milestones');
      console.log('Created milestones collection');

      // Create indexes for milestones collection
      await db.collection('milestones').createIndex({ user: 1 });
      await db.collection('milestones').createIndex({ project: 1 });
      await db.collection('milestones').createIndex({ dueDate: 1 });
      console.log('Created indexes for milestones collection');
    } else {
      console.log('Milestones collection already exists');
    }

    // Notes collection
    if (!(await collectionExists(db, 'notes'))) {
      await db.createCollection('notes');
      console.log('Created notes collection');

      // Create indexes for notes collection
      await db.collection('notes').createIndex({ user: 1 });
      await db.collection('notes').createIndex({ project: 1 });
      console.log('Created indexes for notes collection');
    } else {
      console.log('Notes collection already exists');
    }

    // Stats collection
    if (!(await collectionExists(db, 'stats'))) {
      await db.createCollection('stats');
      console.log('Created stats collection');

      // Create indexes for stats collection
      await db.collection('stats').createIndex({ user: 1 }, { unique: true });
      console.log('Created indexes for stats collection');
    } else {
      console.log('Stats collection already exists');
    }

    // Subscriptions collection
    if (!(await collectionExists(db, 'subscriptions'))) {
      await db.createCollection('subscriptions');
      console.log('Created subscriptions collection');

      // Create indexes for subscriptions collection
      await db.collection('subscriptions').createIndex({ user: 1 }, { unique: true });
      await db.collection('subscriptions').createIndex({ status: 1 });
      await db.collection('subscriptions').createIndex({ expiresAt: 1 });
      console.log('Created indexes for subscriptions collection');
    } else {
      console.log('Subscriptions collection already exists');
    }

    // Fast Tasks collection
    if (!(await collectionExists(db, 'fasttasks'))) {
      await db.createCollection('fasttasks');
      console.log('Created fasttasks collection');

      // Create indexes for fasttasks collection
      await db.collection('fasttasks').createIndex({ user: 1 });
      await db.collection('fasttasks').createIndex({ user: 1, completed: 1 });
      console.log('Created indexes for fasttasks collection');
    } else {
      console.log('Fast Tasks collection already exists');
    }

    // Standalone Tasks collection
    if (!(await collectionExists(db, 'standalonetasks'))) {
      await db.createCollection('standalonetasks');
      console.log('Created standalonetasks collection');

      // Create indexes for standalonetasks collection
      await db.collection('standalonetasks').createIndex({ user: 1 });
      await db.collection('standalonetasks').createIndex({ user: 1, completed: 1 });
      console.log('Created indexes for standalonetasks collection');
    } else {
      console.log('Standalone Tasks collection already exists');
    }

    // Reminders collection
    if (!(await collectionExists(db, 'reminders'))) {
      await db.createCollection('reminders');
      console.log('Created reminders collection');

      // Create indexes for reminders collection
      await db.collection('reminders').createIndex({ user: 1 });
      await db.collection('reminders').createIndex({ time: 1 });
      console.log('Created indexes for reminders collection');
    } else {
      console.log('Reminders collection already exists');
    }

    // Countdowns collection
    if (!(await collectionExists(db, 'countdowns'))) {
      await db.createCollection('countdowns');
      console.log('Created countdowns collection');

      // Create indexes for countdowns collection
      await db.collection('countdowns').createIndex({ user: 1 });
      await db.collection('countdowns').createIndex({ endTime: 1 });
      console.log('Created indexes for countdowns collection');
    } else {
      console.log('Countdowns collection already exists');
    }

    // Active Timers collection
    if (!(await collectionExists(db, 'activetimers'))) {
      await db.createCollection('activetimers');
      console.log('Created activetimers collection');

      // Create indexes for activetimers collection
      await db.collection('activetimers').createIndex({ user: 1 }, { unique: true });
      console.log('Created indexes for activetimers collection');
    } else {
      console.log('Active Timers collection already exists');
    }

    // Backups collection
    if (!(await collectionExists(db, 'backups'))) {
      await db.createCollection('backups');
      console.log('Created backups collection');

      // Create indexes for backups collection
      await db.collection('backups').createIndex({ createdAt: -1 });
      await db.collection('backups').createIndex({ type: 1, createdAt: -1 });
      console.log('Created indexes for backups collection');
    } else {
      console.log('Backups collection already exists');
    }

    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

// Check if collection exists
async function collectionExists(db, collectionName) {
  const collections = await db.listCollections({ name: collectionName }).toArray();
  return collections.length > 0;
}
