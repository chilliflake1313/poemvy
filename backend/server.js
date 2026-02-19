require('dotenv').config();
const app = require('./src/app');
const frontendApp = require('./src/frontendApp');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// Connect to MongoDB
connectDB();

// Start backend API server
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Start frontend static server
frontendApp.listen(FRONTEND_PORT, () => {
  console.log(`🌐 Frontend running on port ${FRONTEND_PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});
