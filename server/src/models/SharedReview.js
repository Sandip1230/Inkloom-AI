const mongoose = require('mongoose');
const { STATUSES } = require('../admin/reviewPolicy');

const { Schema } = mongoose;

const commentSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, required: true, trim: true, maxlength: 120 },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
});

const decisionSchema = new Schema({
  status: { type: String, enum: STATUSES, required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  actorName: { type: String, required: true, trim: true, maxlength: 120 },
  note: { type: String, trim: true, maxlength: 500, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const revisionSchema = new Schema(
  {
    content: { type: String, maxlength: 12000 },
    findings: { type: Schema.Types.Mixed, default: [] },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const assigneeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false },
);

const sharedReviewSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdByName: { type: String, trim: true, maxlength: 120, default: 'Former member' },
    content: { type: String, required: true, maxlength: 12000 },
    contentType: { type: String, trim: true, maxlength: 60, default: 'Other' },
    findings: { type: Schema.Types.Mixed, default: [] },
    guidelineSnapshot: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: STATUSES, default: 'Draft' },
    assignees: { type: [assigneeSchema], default: [] },
    comments: { type: [commentSchema], default: [] },
    decisions: { type: [decisionSchema], default: [] },
    revisions: { type: [revisionSchema], default: [] },
    // Bumps only when the draft text/findings are saved. Used to detect two people editing at once.
    contentRev: { type: Number, default: 1 },
  },
  { timestamps: true },
);

sharedReviewSchema.index({ organizationId: 1, updatedAt: -1 });
sharedReviewSchema.index({ organizationId: 1, 'assignees.userId': 1 });

module.exports = mongoose.model('SharedReview', sharedReviewSchema);