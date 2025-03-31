import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in the environment variables');
}

const MONGODB_URI = process.env.MONGODB_URI;

// Configuration
const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 5000; // 5 seconds

// Track the connection
let isConnected = false;
let retryCount = 0;

async function dbConnect() {
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose;
  }

  // If we've already tried too many times, throw an error
  if (retryCount >= MAX_RETRIES) {
    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      connectTimeoutMS: CONNECTION_TIMEOUT_MS,
      socketTimeoutMS: CONNECTION_TIMEOUT_MS,
    });
    
    isConnected = true;
    retryCount = 0; // Reset retry count on successful connection
    console.log('New database connection established');
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Will reconnect on next request.');
      isConnected = false;
    });
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    retryCount++;
    
    // Try to reconnect after a delay
    console.log(`Retrying connection in ${RETRY_INTERVAL_MS/1000} seconds... (Attempt ${retryCount} of ${MAX_RETRIES})`);
    
    // If we haven't exceeded max retries yet, try again after delay
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
      return dbConnect(); // Recursive call to try again
    }
    
    throw error;
  }
}

export default dbConnect; 