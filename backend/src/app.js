

const express = require('express');
const cors = require('cors');
const path = require('path');
const poemRoutes = require('./routes/poem.routes');
const commentRoutes = require('./routes/comment.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Middleware - Only express.json() and CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

// API Routes
app.use('/api/poems', poemRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Handle @username routes - serve profile.html
app.get('/@:username', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/profile.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

module.exports = app;
