/**
 * Script to fix the subscription collection by:
 * 1. Removing the unique index on the user field
 * 2. Creating a new non-unique index if needed
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// Print environment variables for debugging (without sensitive info)
console.log('Environment variables:');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

async function main() {
  // Connection URL
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected to MongoDB server');

    // Get the database and collection
    const database = client.db('pomodoro-timer');
    const collection = database.collection('subscriptions');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    console.log(JSON.stringify(indexes, null, 2));

    // Check if user_1 index exists
    const userIndex = indexes.find(index => index.name === 'user_1');
    if (userIndex) {
      console.log('Found user_1 index:', userIndex);

      // Drop the index
      console.log('Dropping user_1 index...');
      await collection.dropIndex('user_1');
      console.log('user_1 index dropped successfully');
    } else {
      console.log('No user_1 index found');
    }

    // Verify indexes after dropping
    const remainingIndexes = await collection.indexes();
    console.log('Indexes after dropping:');
    console.log(JSON.stringify(remainingIndexes, null, 2));

    // Create a new non-unique index if needed
    if (!remainingIndexes.some(index => index.name === 'user_1')) {
      console.log('Creating new non-unique index on user field...');
      await collection.createIndex({ user: 1 }, { unique: false });
      console.log('Non-unique index created successfully');
    }

    // Final verification
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:');
    console.log(JSON.stringify(finalIndexes, null, 2));

  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error);
