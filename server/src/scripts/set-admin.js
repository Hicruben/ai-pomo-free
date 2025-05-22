/**
 * Script to set a user as administrator
 *
 * This script updates a user with the specified email to have administrator privileges.
 *
 * Usage:
 * node set-admin.js <email>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../.env' });

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as an argument');
  console.log('Usage: node set-admin.js <email>');
  process.exit(1);
}

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pomodoro-timer';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    setAdminUser(email);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Set user as admin
async function setAdminUser(email) {
  try {
    const db = mongoose.connection;

    // Find user by email
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    // Update user to be admin
    const result = await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          isAdmin: true,
          subscriptionStatus: 'premium',
          maxProjects: 999
        }
      }
    );

    if (result.modifiedCount === 1) {
      console.log(`User ${email} has been set as administrator with premium status`);

      // Also create a premium subscription for this user if it doesn't exist
      const subscription = await db.collection('subscriptions').findOne({ user: user._id });

      if (!subscription) {
        await db.collection('subscriptions').insertOne({
          user: user._id,
          plan: 'lifetime',
          status: 'active',
          paymentMethod: 'admin',
          amount: 0,
          expiresAt: new Date(2099, 11, 31), // Far future date
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created lifetime subscription for ${email}`);
      } else {
        await db.collection('subscriptions').updateOne(
          { _id: subscription._id },
          {
            $set: {
              plan: 'lifetime',
              status: 'active',
              expiresAt: new Date(2099, 11, 31),
              active: true,
              updatedAt: new Date()
            }
          }
        );
        console.log(`Updated subscription for ${email} to lifetime plan`);
      }
    } else {
      console.log(`User ${email} was already an administrator`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error setting admin user:', err);
    process.exit(1);
  }
}
