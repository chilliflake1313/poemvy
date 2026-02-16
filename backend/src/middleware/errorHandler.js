// Error handler middleware for production-safe error responses

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error sanitizer - removes sensitive information
const sanitizeError = (err) => {
  const error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = `Resource not found`;
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    error.message = errors.join(', ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please login again.';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired. Please login again.';
    error.statusCode = 401;
  }

  return error;
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = sanitizeError(err);
  const statusCode = error.statusCode || err.statusCode || 500;

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      statusCode
    });
  } else {
    // Log only message in production
    console.error('❌ Error:', err.message);
  }

  // Send response
  const response = {
    error: error.message || err.message || 'Internal server error',
    statusCode
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

// Async handler wrapper to catch errors in async routes
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
