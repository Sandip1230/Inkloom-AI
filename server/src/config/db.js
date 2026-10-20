const mongoose = require('mongoose');

async function connectDatabase() {
  await mongoose.connect(process.env.MONGO_URI, {
    // Fail fast instead of hanging indefinitely if MongoDB is unreachable
    // (wrong URI, IP not whitelisted, network blocked, etc.).
    serverSelectionTimeoutMS: 8000,
  });
  console.log('Connected to MongoDB');
}

module.exports = connectDatabase;