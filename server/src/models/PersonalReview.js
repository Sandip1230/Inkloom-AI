const mongoose = require('mongoose');

const personalReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // The id the browser gave the review, e.g. "review_1793212345_ab12cd"
    clientId: { type: String, required: true, maxlength: 80 },
    // The full review object (content, findings, status, revisionHistory, ...)
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    // updatedAt in ms from the browser. Newest wins when two devices disagree.
    clientUpdatedAt: { type: Number, default: 0 },
  },
  { timestamps: true },
);

personalReviewSchema.index({ userId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('PersonalReview', personalReviewSchema);