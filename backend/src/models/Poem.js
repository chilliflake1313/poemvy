const mongoose = require('mongoose');

function extractTagsFromContent(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const hashtagMatches = content.match(/#[^\s#]+/g) || [];
  const normalizedUniqueTags = new Set(
    hashtagMatches
      .map((tag) => tag.slice(1))
      .map((tag) => tag.replace(/^[^a-zA-Z0-9_]+|[^a-zA-Z0-9_]+$/g, ''))
      .map((tag) => tag.toLowerCase())
      .filter(Boolean)
  );

  return Array.from(normalizedUniqueTags);
}

function normalizeIncomingTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => String(tag || '').replace(/^#/, '').trim().toLowerCase())
    .map((tag) => tag.replace(/^[^a-zA-Z0-9_]+|[^a-zA-Z0-9_]+$/g, ''))
    .filter(Boolean);
}

const poemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  readCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

poemSchema.pre('validate', function(next) {
  const extractedTags = extractTagsFromContent(this.content);
  const incomingTags = normalizeIncomingTags(this.tags);
  this.tags = Array.from(new Set([...incomingTags, ...extractedTags]));
  next();
});

poemSchema.index({ tags: 1, createdAt: -1 });
poemSchema.index({ content: 'text' });

module.exports = mongoose.model('Poem', poemSchema);

