const Comment = require('../models/Comment');
const Poem = require('../models/Poem');
const mongoose = require('mongoose');

// Helper function to get user ID
function resolveUserId(req) {
  const userIdFromAuth = req.user?._id;
  const userIdFromBody = req.body?.userId;
  const userIdFromHeader = req.headers['x-user-id'];
  return userIdFromAuth || userIdFromBody || userIdFromHeader;
}

// Add a comment to a poem
exports.addComment = async (req, res) => {
  try {
    const { poemId } = req.params;
    const { text } = req.body;
    const userId = resolveUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Valid user ID is required to comment' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Verify poem exists
    const poem = await Poem.findById(poemId);
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }

    const comment = await Comment.create({
      poem: poemId,
      user: userId,
      text: text.trim(),
      parentComment: null
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar bio');

    res.status(201).json({
      success: true,
      comment: populatedComment
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all comments for a poem
exports.getComments = async (req, res) => {
  try {
    const { poemId } = req.params;

    // Verify poem exists
    const poem = await Poem.findById(poemId);
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }

    // Get all top-level comments (no parent)
    const comments = await Comment.find({ poem: poemId, parentComment: null })
      .populate('user', 'username avatar bio')
      .sort({ createdAt: -1 });

    // Get all replies for these comments
    const commentIds = comments.map(c => c._id);
    const replies = await Comment.find({ parentComment: { $in: commentIds } })
      .populate('user', 'username avatar bio')
      .sort({ createdAt: 1 });

    // Organize replies under their parent comments
    const commentsWithReplies = comments.map(comment => {
      const commentReplies = replies.filter(
        reply => reply.parentComment && reply.parentComment.toString() === comment._id.toString()
      );
      return {
        ...comment.toObject(),
        replies: commentReplies
      };
    });

    res.json({
      success: true,
      comments: commentsWithReplies
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reply to a comment
exports.replyToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = resolveUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Valid user ID is required to reply' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    // Verify parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const reply = await Comment.create({
      poem: parentComment.poem,
      user: userId,
      text: text.trim(),
      parentComment: commentId
    });

    const populatedReply = await Comment.findById(reply._id)
      .populate('user', 'username avatar bio');

    res.status(201).json({
      success: true,
      comment: populatedReply
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = resolveUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Valid user ID is required to like a comment' });
    }

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $addToSet: { likes: userId } },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({
      success: true,
      commentId: comment._id,
      liked: true,
      likesCount: comment.likes.length
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Unlike a comment
exports.unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = resolveUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Valid user ID is required to unlike a comment' });
    }

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $pull: { likes: userId } },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({
      success: true,
      commentId: comment._id,
      liked: false,
      likesCount: comment.likes.length
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
