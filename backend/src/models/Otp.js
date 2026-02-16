const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
    select: false // Never return hash in queries
  },
  type: {
    type: String,
    required: true,
    enum: ['verification', 'password-reset', 'email-change', 'password-change'],
    default: 'verification'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - MongoDB will auto-delete when expiresAt is reached
  },
  used: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Max 5 attempts
  }
}, {
  timestamps: true
});

// Index for faster queries
otpSchema.index({ email: 1, used: 1 });
otpSchema.index({ userId: 1, type: 1, used: 1 });

// Hash OTP code before saving
otpSchema.pre('save', async function(next) {
  if (!this.isModified('code')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.code = await bcrypt.hash(this.code, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare OTP code method
otpSchema.methods.compareCode = async function(candidateCode) {
  try {
    return await bcrypt.compare(candidateCode, this.code);
  } catch (error) {
    throw new Error('Code comparison failed');
  }
};

// Method to check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date() && this.attempts < 5;
};

module.exports = mongoose.model('Otp', otpSchema);
