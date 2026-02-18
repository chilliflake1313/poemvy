const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5500'
  ],
  credentials: true
}));

// Rate limiting - general API limiter
app.use('/api/', apiLimiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/poems', require('./routes/poem.routes'));
app.use('/api/collections', require('./routes/collection.routes'));
app.use('/api/tags', require('./routes/tag.routes'));
app.use('/api/upload', require('./routes/upload.routes'));


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Base API route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Poemvy API is running'
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
