const express = require('express');
const rateLimit = require('express-rate-limit');
const PersonalReview = require('../models/PersonalReview');
const requireAuth = require('../middleware/requireAuth');
const { STATUSES } = require('../admin/reviewPolicy');

const router = express.Router();

const MAX_CONTENT = 12000;
const MAX_FINDINGS = 200;
const MAX_REVISIONS = 20;
const MAX_REVIEWS = 500;
const MAX_REVIEW_BYTES = 1000000;
const ID_PATTERN = /^review_[A-Za-z0-9_-]{1,70}$/;

function handleRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

router.use(requireAuth);
router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (request) => request.method === 'GET',
  message: { error: 'Too many review changes. Wait a few minutes and try again.' },
}));

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

const objects = (value, max) => (
  Array.isArray(value)
    ? value.slice(0, max).filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    : []
);

// Keeps only the fields we expect. Returns null if the review is not valid.
function cleanReview(input) {
  if (!input || typeof input !== 'object') return null;
  if (typeof input.id !== 'string' || !ID_PATTERN.test(input.id)) return null;
  if (typeof input.content !== 'string' || !input.content.trim() || input.content.length > MAX_CONTENT) {
    return null;
  }

  const now = Date.now();
  const updatedAt = Number.isFinite(input.updatedAt) ? Math.min(input.updatedAt, now + 60000) : now;

  const revisionHistory = (Array.isArray(input.revisionHistory) ? input.revisionHistory : [])
    .slice(0, MAX_REVISIONS)
    .filter((item) => item && typeof item.content === 'string')
    .map((item) => ({
      content: item.content.slice(0, MAX_CONTENT),
      findings: objects(item.findings, MAX_FINDINGS),
      updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : updatedAt,
    }));

  const review = {
    id: input.id,
    content: input.content,
    contentType: text(input.contentType, 60) || 'Other',
    findings: objects(input.findings, MAX_FINDINGS),
    status: STATUSES.includes(input.status) ? input.status : 'Draft',
    reviewer: text(input.reviewer, 120),
    comment: text(input.comment, 500),
    guidelineSnapshot: { preferredTerms: text(input.guidelineSnapshot?.preferredTerms, 5000) },
    revisionHistory,
    updatedAt,
  };

  if (JSON.stringify(review).length > MAX_REVIEW_BYTES) return null;
  return review;
}

// Saves a review unless the server already has a newer version of it.
async function upsertReview(userId, review) {
  const filter = { userId, clientId: review.id };
  const existing = await PersonalReview.findOne(filter).select('clientUpdatedAt').lean();

  if (existing) {
    if (existing.clientUpdatedAt > review.updatedAt) return false;
  } else if ((await PersonalReview.countDocuments({ userId })) >= MAX_REVIEWS) {
    return false;
  }

  try {
    await PersonalReview.updateOne(
      filter,
      { $set: { data: review, clientUpdatedAt: review.updatedAt } },
      { upsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error; // 11000 = a parallel request created it first
  }
  return true;
}

async function listForUser(userId) {
  const rows = await PersonalReview.find({ userId })
    .sort({ clientUpdatedAt: -1 })
    .limit(MAX_REVIEWS)
    .lean();
  return rows.map((row) => row.data);
}

// All of the signed-in user's personal reviews.
router.get('/', handleRoute(async (request, response) => {
  response.json(await listForUser(request.userId));
}));

// Upload several reviews at once (used to move this browser's reviews into the account).
router.post('/sync', handleRoute(async (request, response) => {
  const incoming = Array.isArray(request.body?.reviews) ? request.body.reviews.slice(0, MAX_REVIEWS) : [];
  for (const item of incoming) {
    const review = cleanReview(item);
    if (review) await upsertReview(request.userId, review);
  }
  response.json(await listForUser(request.userId));
}));

// Save one review (used on every save).
router.put('/:clientId', handleRoute(async (request, response) => {
  const review = cleanReview(request.body);
  if (!review || review.id !== request.params.clientId) {
    return response.status(400).json({ error: 'Review is invalid.' });
  }
  const saved = await upsertReview(request.userId, review);
  return response.json({ saved });
}));

module.exports = router;