const Poem = require('../models/Poem');

// Create a new poem
exports.createPoem = async (req, res) => {
  try {
    const { title, content } = req.body;
    const poemData = {
      title,
      content
    };

    if (req.user && req.user._id) {
      poemData.author = req.user._id;
    }

    const poem = await Poem.create(poemData);
    res.status(201).json(poem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all poems
exports.getPoems = async (req, res) => {
  try {
    const poems = await Poem.find().populate('author', 'username');
    res.json(poems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
