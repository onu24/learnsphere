/**
 * This file represents the server-side MongoDB connection logic.
 * In a real production deployment, this code would run on a Node.js server.
 * The current frontend uses services/mockMongo.ts to simulate this behavior in the browser.
 */

const mongoose = require('mongoose');

// --- Database Connection ---
const DB_NAME = 'pdf_store_v2';
const MONGO_URI = process.env.MONGO_URI || `mongodb://localhost:27017/${DB_NAME}`;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${DB_NAME}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// --- User Schema ---
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// --- Transaction Schema ---
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  payerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  courses: [{
    type: String,
    required: true
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed'],
    default: 'Pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  connectDB,
  User,
  Transaction
};