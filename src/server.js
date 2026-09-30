const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize Database connection
connectDB();

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 [Property Hub Backend Server Started]`);
  console.log(`📡 Port: http://localhost:${PORT}`);
  console.log(`🩺 Health API: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
});
