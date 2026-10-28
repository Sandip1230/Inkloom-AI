const mongoose = require('mongoose');

// One approved-reference document. Every edit creates a new immutable version;
// each version carries its own approval state so a claim finding can always be
// traced back to the exact revision (and approver) that supplied the evidence.
const referenceVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    content: { type: String, required: true, maxlength: 200000 },
    contentHash: { type: String, required: true },
    changeNote: { type: String, trim: true, maxlength: 500, default: '' },
    sourceFileName: { type: String, trim: true, maxlength: 255, default: '' },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    uploadedAt: { type: Date, default: Date.now },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
  },
  { _id: false },
);

const referenceDocumentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    // Person / team accountable for the source (free text, like governance sources).
    owner: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    // "retired" documents are kept for traceability but never searched.
    status: { type: String, enum: ['active', 'retired'], default: 'active', required: true },
    currentVersion: { type: Number, required: true, default: 1 },
    versions: { type: [referenceVersionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

referenceDocumentSchema.index({ organizationId: 1, updatedAt: -1 });

module.exports = mongoose.model('ReferenceDocument', referenceDocumentSchema);