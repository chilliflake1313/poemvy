const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');

// POST /api/comments/:commentId/reply - Reply to a comment
router.post('/:commentId/reply', commentController.replyToComment);

// POST /api/comments/:commentId/like - Like a comment
router.post('/:commentId/like', commentController.likeComment);

// POST /api/comments/:commentId/unlike - Unlike a comment
router.post('/:commentId/unlike', commentController.unlikeComment);

module.exports = router;
