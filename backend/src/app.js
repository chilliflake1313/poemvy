

const express = require('express');
const cors = require('cors');
const poemRoutes = require('./routes/poem.routes');

const app = express();

// Middleware - Only express.json() and CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/poems', poemRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

module.exports = app;
