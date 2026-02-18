
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://localhost:5500', credentials: true }));
app.use(express.json());

// Only poems routes
app.use('/api/poems', require('./routes/poem.routes'));

// Minimal 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
