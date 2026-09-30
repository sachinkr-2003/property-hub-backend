const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/property_hub_db');
    console.log(`✅ [MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ [MongoDB Connection Warning]: ${error.message}`);
    console.warn('ℹ️ Running in resilient mode. Database operations will wait for MongoDB or use fallback memory cache.');
  }
};

module.exports = connectDB;
