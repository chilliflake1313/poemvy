const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    console.log('[PROTECT MIDDLEWARE]', req.method, req.originalUrl);
    console.log('[PROTECT] Authorization header:', req.headers.authorization ? 'Present' : '❌ MISSING');

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('[PROTECT] Token extracted:', token.substring(0, 20) + '...');
    }

    if (!token) {
      console.error('[PROTECT] ❌ No token provided');
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.error('[PROTECT] ❌ User not found in database, ID:', decoded.id);
        return res.status(401).json({ error: 'User not found' });
      }

      console.log('[PROTECT] ✅ User authenticated:', {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        isEmailVerified: req.user.isEmailVerified
      });

      // Check if password was changed after token was issued
      if (req.user.passwordChangedAt) {
        const changedTimestamp = parseInt(req.user.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
          return res.status(401).json({ error: 'Password was changed. Please login again.' });
        }
      }

      next();
    } catch (error) {
      console.error('[PROTECT] ❌ Token verification failed:', error.message);
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
  console.log('[REQUIRE EMAIL VERIFIED] Checking user:', req.user?.username, 'isVerified:', req.user?.isEmailVerified);
  
  if (!req.user) {
    console.error('[REQUIRE EMAIL VERIFIED] ❌ No user in request');
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isEmailVerified) {
    console.warn('[REQUIRE EMAIL VERIFIED] ❌ Email not verified for user:', req.user.username);
    return res.status(403).json({ 
      error: 'Email verification required. Please verify your email to publish poems.',
      requiresEmailVerification: true 
    });
  }

  console.log('[REQUIRE EMAIL VERIFIED] ✅ Email verified');
  next();
};

module.exports = { protect, optionalAuth, authorize, requireEmailVerified };
