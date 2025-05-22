// This script will be executed when the MongoDB container starts for the first time
db = db.getSiblingDB('admin');

// Create application user with access to the pomodoro-timer database
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [
    { role: 'readWrite', db: 'pomodoro-timer' },
    { role: 'dbAdmin', db: 'pomodoro-timer' },
    { role: 'backup', db: 'admin' }  // Add backup role for database backup operations
  ]
});

// Initialize the pomodoro-timer database
db = db.getSiblingDB('pomodoro-timer');

// Create collections based on data models in functionality specification
db.createCollection('users');
db.createCollection('projects');
db.createCollection('tasks');
db.createCollection('pomodoros');
db.createCollection('milestones');
db.createCollection('notes');
db.createCollection('stats');

// Additional collections for new features
db.createCollection('backups');         // For database backup records
db.createCollection('subscriptions');   // For user subscription management
db.createCollection('fasttasks');       // For standalone pomodoro tasks
db.createCollection('standalonetasks'); // For standalone tasks
db.createCollection('reminders');       // For task reminders
db.createCollection('countdowns');      // For countdown timers
db.createCollection('activetimers');    // For active timer sessions
db.createCollection('settings');        // For user settings

// Create indexes for efficient queries
// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ googleId: 1 }, { sparse: true });
db.users.createIndex({ activeTask: 1 }, { sparse: true });
db.users.createIndex({ isAdmin: 1 });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ lastLogin: 1 });
db.users.createIndex({ isActive: 1 });

// Project indexes
db.projects.createIndex({ user: 1 });
db.projects.createIndex({ status: 1, user: 1 });
db.projects.createIndex({ deadline: 1 });

// Task indexes
db.tasks.createIndex({ user: 1 });
db.tasks.createIndex({ project: 1 });
db.tasks.createIndex({ user: 1, project: 1 });
db.tasks.createIndex({ completed: 1, project: 1 });
db.tasks.createIndex({ dueDate: 1 });
db.tasks.createIndex({ todoistId: 1, user: 1 }, { sparse: true });

// Pomodoro indexes
db.pomodoros.createIndex({ user: 1 });
db.pomodoros.createIndex({ task: 1 }, { sparse: true });
db.pomodoros.createIndex({ project: 1 }, { sparse: true });
db.pomodoros.createIndex({ startTime: 1 });
db.pomodoros.createIndex({ endTime: 1 });
db.pomodoros.createIndex({ user: 1, startTime: 1 });
db.pomodoros.createIndex({ user: 1, completed: 1 });
db.pomodoros.createIndex({ user: 1, type: 1 });
db.pomodoros.createIndex({ user: 1, startTime: -1, type: 1 });
db.pomodoros.createIndex({ user: 1, date: 1 });
db.pomodoros.createIndex({ date: 1 });  // For admin statistics

// Milestone indexes
db.milestones.createIndex({ user: 1 });
db.milestones.createIndex({ project: 1 });
db.milestones.createIndex({ dueDate: 1 });
db.milestones.createIndex({ completed: 1 });

// Note indexes
db.notes.createIndex({ user: 1 });
db.notes.createIndex({ project: 1 });
db.notes.createIndex({ position: 1 });

// Stats indexes
db.stats.createIndex({ user: 1 }, { unique: true });

// Backup indexes
db.backups.createIndex({ createdAt: -1 });
db.backups.createIndex({ type: 1, createdAt: -1 });
db.backups.createIndex({ createdBy: 1 });

// Subscription indexes
db.subscriptions.createIndex({ user: 1 }, { unique: true });
db.subscriptions.createIndex({ status: 1 });
db.subscriptions.createIndex({ expiresAt: 1 });
db.subscriptions.createIndex({ plan: 1 });

// Fast tasks indexes
db.fasttasks.createIndex({ user: 1 });
db.fasttasks.createIndex({ user: 1, completed: 1 });
db.fasttasks.createIndex({ dueDate: 1 });

// Reminder indexes
db.reminders.createIndex({ user: 1 });
db.reminders.createIndex({ task: 1 });
db.reminders.createIndex({ reminderTime: 1 });
db.reminders.createIndex({ completed: 1 });

// Countdown indexes
db.countdowns.createIndex({ user: 1 });
db.countdowns.createIndex({ endTime: 1 });

// Standalone tasks indexes
db.standalonetasks.createIndex({ user: 1 });
db.standalonetasks.createIndex({ user: 1, completed: 1 });
db.standalonetasks.createIndex({ dueDate: 1 });

// Active timers indexes
db.activetimers.createIndex({ user: 1 }, { unique: true });
db.activetimers.createIndex({ isRunning: 1 });
db.activetimers.createIndex({ lastUpdatedTime: 1 });

// Settings indexes
db.settings.createIndex({ user: 1 }, { unique: true });

// Create default admin user if it doesn't exist
try {
  const adminExists = db.users.findOne({ email: 'admin@localhost' });

  if (!adminExists) {
    print('Creating default admin user...');

    // Generate a hashed password for 'admin123' (this is just a placeholder, should be changed)
    // In production, you would use bcrypt to hash the password
    const adminUser = {
      name: 'Admin User',
      email: 'admin@localhost',
      password: '$2a$10$XFE0rQyZ5GFMBVWNvg6Z5.RaVrNVw4.PQVV0vTJnTXVcgMhw4Syia', // hashed 'admin123'
      isAdmin: true,
      isActive: true,
      maxProjects: 999, // Allow unlimited projects
      createdAt: new Date(),
      lastLogin: new Date()
    };

    db.users.insertOne(adminUser);
    print('Admin user created successfully');
  } else {
    print('Admin user already exists, skipping creation');
  }
} catch (error) {
  print('Error creating admin user: ' + error.message);
}

// Set up default backup settings
try {
  const settingsExist = db.settings.findOne({ key: 'backup' });

  if (!settingsExist) {
    print('Creating default backup settings...');

    const backupSettings = {
      key: 'backup',
      enableAutoBackup: false,
      backupFrequency: 'daily',
      maxBackups: 10,
      backupDir: 'backups',
      lastBackup: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.settings.insertOne(backupSettings);
    print('Default backup settings created successfully');
  } else {
    print('Backup settings already exist, skipping creation');
  }
} catch (error) {
  print('Error creating backup settings: ' + error.message);
}

print('MongoDB initialization completed successfully');
