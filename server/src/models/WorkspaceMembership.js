const mongoose = require('mongoose');

const workspaceMembershipSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'admin', 'reviewer', 'creator'], required: true },
  },
  { timestamps: true },
);

workspaceMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceMembership', workspaceMembershipSchema);
