const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    avatar: { type: String },
    googleId: { type: String, index: true, sparse: true, unique: true },
    githubId: { type: String, index: true, sparse: true, unique: true },
    passwordHash: { type: String },
    resetCodeHash: { type: String },
    resetCodeExpires: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);