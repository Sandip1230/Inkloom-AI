const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, maxlength: 80 },
    resourceType: { type: String, required: true, maxlength: 80 },
    resourceId: { type: String, maxlength: 120 },
    summary: { type: String, required: true, maxlength: 240 },
  },
  { timestamps: true },
);

auditEventSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
