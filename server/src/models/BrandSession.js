const mongoose = require('mongoose');

const brandSessionSchema = new mongoose.Schema(
  {
    brief: { type: String, required: true, trim: true },
    stages: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

module.exports = mongoose.model('BrandSession', brandSessionSchema);