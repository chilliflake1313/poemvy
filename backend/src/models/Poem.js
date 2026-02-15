const mongoose = require('mongoose');

const poemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Poem title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Poem body is required'],
    maxlength: [10000, 'Poem body cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  publishedAt: Date,
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
poemSchema.index({ author: 1, createdAt: -1 });
poemSchema.index({ tags: 1 });
poemSchema.index({ collection: 1 });
poemSchema.index({ publishedAt: -1 });
poemSchema.index({ isDraft: 1, author: 1 });

// Virtual for like count
poemSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
poemSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Update publishedAt when isDraft changes to false
poemSchema.pre('save', function(next) {
  if (this.isModified('isDraft') && !this.isDraft && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Poem', poemSchema);
