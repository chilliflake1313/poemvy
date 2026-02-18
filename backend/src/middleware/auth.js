const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    console.log("PROTECT SECRET:", process.env.JWT_SECRET);
  try {
    let token

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    console.log("TOKEN:", token)

    if (!token) {
      return res.status(401).json({ message: "No token" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("DECODED:", decoded)

    const user = await User.findById(decoded.id)
    console.log("USER FOUND:", user)

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = user
    next()

  } catch (err) {
    console.log("JWT ERROR:", err.message)
    return res.status(401).json({ message: err.message })
  }
}

exports.requireEmailVerified = (req, res, next) => {
  if (!req.user || !req.user.isEmailVerified) {
    return res.status(403).json({ error: 'Email not verified' });
  }
  next();
};

exports.optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};
