const mongoose = require('mongoose');

const sourceVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: String, required: true, maxlength: 50000 },
    owner: { type: String, required: true, trim: true, maxlength: 160 },
    effectiveDate: { type: Date, required: true },
    reviewDate: { type: Date },
    confidentiality: { type: String, enum: ['internal', 'confidential', 'public'], required: true },
    changeNote: { type: String, trim: true, maxlength: 500 },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const governanceSourceSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    kind: {
      type: String,
      enum: ['brand-guide', 'approved-facts', 'claim-evidence', 'terminology', 'asset-rules', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: String, required: true, maxlength: 50000 },
    owner: { type: String, required: true, trim: true, maxlength: 160 },
    effectiveDate: { type: Date, required: true },
    reviewDate: { type: Date },
    confidentiality: { type: String, enum: ['internal', 'confidential', 'public'], required: true },
    currentVersion: { type: Number, required: true, default: 1 },
    versions: { type: [sourceVersionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('GovernanceSource', governanceSourceSchema);
