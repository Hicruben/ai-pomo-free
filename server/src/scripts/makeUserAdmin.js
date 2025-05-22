/**
 * Script to make a user an admin
 *
 * Usage: node src/scripts/makeUserAdmin.js <email>
 * Example: node src/scripts/makeUserAdmin.js admin@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  console.error('Usage: node src/scripts/makeUserAdmin.js <email>');
  process.exit(1);
}

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
console.log('Connecting to MongoDB with URI:', mongoUri ? 'URI found' : 'URI not found');

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected');

    try {
      console.log(`Looking for user with email: ${email}`);

      // Count all users in the database
      const userCount = await User.countDocuments();
      console.log(`Total users in database: ${userCount}`);

      // List all users
      const allUsers = await User.find({}, 'email name');
      console.log('All users in database:');
      allUsers.forEach(u => console.log(`- ${u.name} (${u.email})`));

      // Find user by email
      let user = await User.findOne({ email });

      if (!user) {
        console.log(`User with email ${email} not found.`);
        console.log(`Please register a user with email ${email} first, then run this script again.`);
        process.exit(1);
      } else {
        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current admin status: ${user.isAdmin ? 'Admin' : 'Not Admin'}`);

        // Make user an admin
        user.isAdmin = true;
        await user.save();
      }

      console.log(`User ${user.name} (${user.email}) is now an admin`);
    } catch (error) {
      console.error('Error making user admin:', error);
      console.error(error.stack);
    } finally {
      // Close the connection
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Please check that your .env file contains the MONGODB_URI variable');
    process.exit(1);
  });
