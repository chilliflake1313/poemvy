const rateLimit = require('express-rate-limit');

// Strict rate limiter for auth endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Moderate rate limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for email change requests
const emailChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many email change attempts. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false
});

// Moderate rate limiter for OTP verification attempts
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, //10 attempts per 15 minutes
  message: 'Too many verification attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  emailChangeLimiter,
  otpVerifyLimiter,
  apiLimiter
};
