const mongoose = require('mongoose');

const STATUSES = ['Supported', 'Contradicted', 'Unverified'];

// Evidence is stored as a snapshot (excerpt text + document title/owner/version)
// so the finding stays traceable even if the document is later edited or retired.
const evidenceSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferenceDocument', required: true },
    documentTitle: { type: String, required: true },
    documentOwner: { type: String, default: '' },
    version: { type: Number, required: true },
    contentHash: { type: String, default: '' },
    excerpt: { type: String, required: true },
    location: {
      section: { type: String, default: '' },
      paragraph: { type: Number, default: 0 },
      line: { type: Number, default: 0 },
      startOffset: { type: Number, default: 0 },
      endOffset: { type: Number, default: 0 },
    },
    score: { type: Number, default: 0 },
    // How the analysis step relates this excerpt to the claim.
    relation: { type: String, enum: ['supports', 'contradicts', 'neutral', 'unassessed'], default: 'unassessed' },
    quote: { type: String, default: '' },
  },
  { _id: false },
);

const historySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['submitted', 'suggested', 'reviewed'], required: true },
    status: { type: String, enum: STATUSES },
    previousStatus: { type: String, enum: [...STATUSES, null], default: null },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    byName: { type: String, default: '' },
    notes: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const claimReviewSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    claim: { type: String, required: true, trim: true, maxlength: 2000 },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submittedByName: { type: String, default: '' },
    evidence: { type: [evidenceSchema], default: [] },
    suggestion: {
      status: { type: String, enum: STATUSES, required: true },
      rationale: { type: String, default: '' },
      // ai = model-assessed and grounded; none = nothing retrieved; unavailable = AI could not run
      method: { type: String, enum: ['ai', 'none', 'unavailable'], required: true },
      model: { type: String, default: '' },
      generatedAt: { type: Date, default: Date.now },
    },
    reviewState: { type: String, enum: ['pending', 'reviewed'], default: 'pending', index: true },
    finalDecision: {
      status: { type: String, enum: STATUSES },
      notes: { type: String, default: '' },
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewerName: { type: String, default: '' },
      reviewedAt: { type: Date },
      changedFromSuggestion: { type: Boolean, default: false },
    },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

claimReviewSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('ClaimReview', claimReviewSchema);
module.exports.STATUSES = STATUSES;