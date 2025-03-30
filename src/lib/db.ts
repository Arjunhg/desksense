import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in the environment variables');
}

const MONGODB_URI = process.env.MONGODB_URI;

// Track the connection
let isConnected = false;

async function dbConnect() {
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    
    isConnected = true;
    console.log('New database connection established');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default dbConnect; 