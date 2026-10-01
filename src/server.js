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

// Automatic recovery if port is temporarily occupied
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ [Port ${PORT} in use]: Stale process detected. Cleaning up...`);
    try {
      require('../kill-port');
      setTimeout(() => {
        server.close();
        server.listen(PORT);
      }, 800);
    } catch (_) {
      process.exit(1);
    }
  } else {
    console.error('❌ Server Listen Error:', err);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
});

// Graceful shutdown to release port cleanly on restart / kill
const gracefulExit = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);
process.once('SIGUSR2', () => {
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});
