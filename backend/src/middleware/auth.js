const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check if password was changed after token was issued
      if (req.user.passwordChangedAt) {
        const changedTimestamp = parseInt(req.user.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
          return res.status(401).json({ error: 'Password was changed. Please login again.' });
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error in auth middleware' });
  }
};

// Optional auth - attach user if token exists but don't require it
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Token invalid but that's okay for optional auth
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Check if user is the owner of a resource
const authorize = (req, res, next) => {
  if (req.user && req.resource && req.user._id.toString() === req.resource.owner.toString()) {
    next();
  } else if (req.user && req.resource && req.user._id.toString() === req.resource.author?.toString()) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized to access this resource' });
  }
};

// Require email verification
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      error: 'Email verification required. Please verify your email to publish poems.',
      requiresEmailVerification: true 
    });
  }

  next();
};

module.exports = { protect, optionalAuth, authorize, requireEmailVerified };
