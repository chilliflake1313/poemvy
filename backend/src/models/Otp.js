const mongoose = require('mongoose');

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
    length: 6
  },
  type: {
    type: String,
    required: true,
    enum: ['verification', 'password-reset'],
    default: 'verification'
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
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
otpSchema.index({ email: 1, used: 1 });

// Method to check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date();
};

module.exports = mongoose.model('Otp', otpSchema);
