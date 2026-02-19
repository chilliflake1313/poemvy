require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/poemvy';

async function cleanupDrafts() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const Poem = mongoose.connection.collection('poems');

  // Remove all draft poems
  const deleteResult = await Poem.deleteMany({ isDraft: true });
  console.log(`Deleted ${deleteResult.deletedCount} draft poems.`);

  // Remove isDraft and publishedAt fields from all poems
  const updateResult = await Poem.updateMany({}, { $unset: { isDraft: '', publishedAt: '' } });
  console.log(`Updated ${updateResult.modifiedCount} poems to remove draft fields.`);

  await mongoose.disconnect();
  console.log('Cleanup complete.');
}

cleanupDrafts().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
