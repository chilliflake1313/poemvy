

const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins (or specify origin as needed)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'file://'
  ],
  credentials: true
}));

app.use(express.json());

// API routes


app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/poems', require('./routes/poem.routes'));

// Root endpoint for health check or welcome
app.get('/', (req, res) => {
  res.json({ message: 'Poemvy backend is running!' });
});

// Minimal 404 handler for API
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
