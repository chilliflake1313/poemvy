const Poem = require('../models/Poem');

// Create and publish a new poem
exports.createPoem = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const poem = await Poem.create({ title, content });
    res.status(201).json(poem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all published poems (sorted by newest first)
exports.getPoems = async (req, res) => {
  try {
    const poems = await Poem.find().sort({ createdAt: -1 });
    res.json(poems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
