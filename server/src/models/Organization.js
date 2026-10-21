const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    auditRetentionDays: { type: Number, required: true, default: 365, min: 30, max: 3650 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Organization', organizationSchema);
