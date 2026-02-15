const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true,
    maxlength: [100, 'Collection name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  poems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poem'
  }],
  coverImage: {
    url: String,
    publicId: String
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
collectionSchema.index({ owner: 1, createdAt: -1 });
collectionSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for poem count
collectionSchema.virtual('poemCount').get(function() {
  return this.poems.length;
});

// Virtual for follower count
collectionSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

module.exports = mongoose.model('Collection', collectionSchema);
