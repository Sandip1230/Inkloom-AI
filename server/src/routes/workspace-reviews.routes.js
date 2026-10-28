const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const AuditEvent = require('../models/AuditEvent');
const SharedReview = require('../models/SharedReview');
const User = require('../models/User');
const WorkspaceMembership = require('../models/WorkspaceMembership');
const requireAuth = require('../middleware/requireAuth');
const {
  STATUSES,
  canAssignReviewers,
  canDeleteReview,
  canEditReview,
  canTransition,
  isReviewerRole,
  reviewPermissions,
} = require('../admin/reviewPolicy');

const router = express.Router({ mergeParams: true });

const MAX_CONTENT = 12000;
const MAX_FINDINGS = 200;
const MAX_ASSIGNEES = 10;
const MAX_REVISIONS = 50;
const MAX_COMMENTS = 500;
const MAX_DECISIONS = 200;

const ACTION_BY_STATUS = {
  'Awaiting approval': 'review.approval_requested',
  'Changes requested': 'review.changes_requested',
  Approved: 'review.approved',
};

function handleRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const toMs = (value) => (value ? new Date(value).getTime() : Date.now());
const viewerOf = (request) => ({ role: request.membership.role, userId: request.userId });

async function loadMembership(request, response, next) {
  const { workspaceId } = request.params;
  if (!validId(workspaceId)) {
    return response.status(400).json({ error: 'Workspace ID is invalid.' });
  }
  const membership = await WorkspaceMembership.findOne({
    organizationId: workspaceId,
    userId: request.userId,
  }).lean();
  if (!membership) return response.status(404).json({ error: 'Workspace not found.' });
  request.membership = membership;
  return next();
}

router.use(requireAuth);
router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (request) => request.method === 'GET',
  message: { error: 'Too many review changes. Wait a few minutes and try again.' },
}));
router.use(handleRoute(loadMembership));

// ---------- helpers ----------

async function getActorName(userId) {
  const user = await User.findById(userId).select('name email').lean();
  return user?.name || user?.email || 'Team member';
}

async function recordEvent(request, action, reviewId, summary) {
  await AuditEvent.create({
    organizationId: request.params.workspaceId,
    actorId: request.userId,
    action,
    resourceType: 'review',
    resourceId: String(reviewId),
    summary: summary.slice(0, 240),
  });
}

async function loadReview(request, response) {
  const { workspaceId, reviewId } = request.params;
  if (!validId(reviewId)) {
    response.status(400).json({ error: 'Review ID is invalid.' });
    return null;
  }
  // organizationId in the filter = workspace isolation (no cross-workspace access by guessing ids).
  const review = await SharedReview.findOne({ _id: reviewId, organizationId: workspaceId }).lean();
  if (!review) {
    response.status(404).json({ error: 'Review not found in this workspace.' });
    return null;
  }
  return review;
}

function cleanFindings(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_FINDINGS)
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item));
}

function cleanGuidelines(value) {
  const preferredTerms = typeof value?.preferredTerms === 'string' ? value.preferredTerms.slice(0, 5000) : '';
  return { preferredTerms };
}

function parseReviewBody(body) {
  const content = typeof body?.content === 'string' ? body.content : '';
  if (!content.trim() || content.length > MAX_CONTENT) {
    return { error: `Content must contain 1 to ${MAX_CONTENT} characters.` };
  }
  const contentType = typeof body?.contentType === 'string' && body.contentType.trim()
    ? body.contentType.trim().slice(0, 60)
    : 'Other';
  return {
    value: {
      content,
      contentType,
      findings: cleanFindings(body?.findings),
      guidelineSnapshot: cleanGuidelines(body?.guidelineSnapshot),
    },
  };
}

// Same shape the old localStorage reviews had (id, content, status, reviewer, comment,
// revisionHistory, updatedAt in ms) plus the new team fields.
function serialize(review, viewer) {
  const decisions = review.decisions || [];
  const lastDecision = [...decisions].reverse().find((item) => item.status !== 'Draft');
  return {
    id: String(review._id),
    workspaceId: String(review.organizationId),
    content: review.content,
    contentType: review.contentType,
    findings: review.findings || [],
    status: review.status,
    reviewer: lastDecision?.actorName || '',
    comment: lastDecision?.note || '',
    guidelineSnapshot: review.guidelineSnapshot || {},
    revisionHistory: [...(review.revisions || [])].reverse().map((item) => ({
      content: item.content,
      findings: item.findings || [],
      updatedAt: toMs(item.savedAt),
    })),
    createdAt: toMs(review.createdAt),
    updatedAt: toMs(review.updatedAt),
    createdBy: {
      id: review.createdBy ? String(review.createdBy) : null,
      name: review.createdByName || 'Former member',
    },
    assignees: (review.assignees || []).map((item) => ({ id: String(item.userId), name: item.name || 'Member' })),
    comments: (review.comments || []).map((item) => ({
      id: String(item._id),
      authorId: item.authorId ? String(item.authorId) : null,
      authorName: item.authorName,
      text: item.text,
      createdAt: toMs(item.createdAt),
    })),
    decisions: decisions.map((item) => ({
      id: String(item._id),
      status: item.status,
      actorName: item.actorName,
      note: item.note || '',
      createdAt: toMs(item.createdAt),
    })),
    contentRev: review.contentRev,
    can: reviewPermissions({ role: viewer.role, userId: viewer.userId, review }),
  };
}

// ---------- routes ----------

// Light endpoint for the UI: my role + the member list (for the assignee picker).
router.get('/meta', handleRoute(async (request, response) => {
  const members = await WorkspaceMembership.find({ organizationId: request.params.workspaceId })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 })
    .lean();
  return response.json({
    userId: String(request.userId),
    role: request.membership.role,
    members: members
      .filter((member) => member.userId)
      .map((member) => ({
        id: String(member.userId._id),
        name: member.userId.name || member.userId.email || 'Member',
        email: member.userId.email || '',
        role: member.role,
      })),
  });
}));

router.get('/', handleRoute(async (request, response) => {
  const filter = { organizationId: request.params.workspaceId };
  if (typeof request.query.status === 'string' && STATUSES.includes(request.query.status)) {
    filter.status = request.query.status;
  }
  if (request.query.assignedToMe === '1') filter['assignees.userId'] = request.userId;

  const reviews = await SharedReview.find(filter).sort({ updatedAt: -1 }).limit(200).lean();
  const viewer = viewerOf(request);
  return response.json(reviews.map((review) => serialize(review, viewer)));
}));

router.post('/', handleRoute(async (request, response) => {
  const parsed = parseReviewBody(request.body);
  if (parsed.error) return response.status(400).json({ error: parsed.error });

  const actorName = await getActorName(request.userId);
  const review = await SharedReview.create({
    organizationId: request.params.workspaceId,
    createdBy: request.userId,
    createdByName: actorName,
    ...parsed.value,
    status: 'Draft',
    decisions: [{ status: 'Draft', actorId: request.userId, actorName, note: 'Draft created.' }],
  });
  await recordEvent(request, 'review.created', review._id, `Created a ${parsed.value.contentType} review.`);
  return response.status(201).json(serialize(review.toObject(), viewerOf(request)));
}));

router.get('/:reviewId', handleRoute(async (request, response) => {
  const review = await loadReview(request, response);
  if (!review) return;
  return response.json(serialize(review, viewerOf(request)));
}));

router.put('/:reviewId', handleRoute(async (request, response) => {
  const review = await loadReview(request, response);
  if (!review) return;
  const viewer = viewerOf(request);
  if (!canEditReview({ ...viewer, review })) {
    return response.status(403).json({ error: 'Only the author or a workspace admin can edit this draft.' });
  }

  const parsed = parseReviewBody(request.body);
  if (parsed.error) return response.status(400).json({ error: parsed.error });
  const expectedRev = Number(request.body?.expectedRev);
  if (!Number.isInteger(expectedRev)) {
    return response.status(400).json({ error: 'expectedRev is required.' });
  }

  const actorName = await getActorName(request.userId);
  const contentChanged = parsed.value.content !== review.content;
  const set = {
    contentType: parsed.value.contentType,
    findings: parsed.value.findings,
    guidelineSnapshot: parsed.value.guidelineSnapshot,
  };
  const update = { $set: set, $inc: { contentRev: 1 } };

  if (contentChanged) {
    set.content = parsed.value.content;
    update.$push = {
      revisions: {
        $each: [{ content: review.content, findings: review.findings || [], savedAt: review.updatedAt }],
        $slice: -MAX_REVISIONS,
      },
    };
    if (review.status !== 'Draft') {
      set.status = 'Draft';
      update.$push.decisions = {
        $each: [{
          status: 'Draft',
          actorId: request.userId,
          actorName,
          note: 'Text was edited after review started, so it went back to Draft.',
        }],
        $slice: -MAX_DECISIONS,
      };
    }
  }

  const updated = await SharedReview.findOneAndUpdate(
    { _id: review._id, organizationId: request.params.workspaceId, contentRev: expectedRev },
    update,
    { new: true, runValidators: true },
  ).lean();

  if (!updated) {
    return response.status(409).json({
      error: 'A teammate changed this review. Reload to see the latest version.',
      code: 'REV_CONFLICT',
    });
  }

  if (contentChanged) {
    await recordEvent(request, 'review.edited', review._id, `Edited the draft text (revision ${updated.contentRev}).`);
  }
  return response.json(serialize(updated, viewer));
}));

router.put('/:reviewId/assignees', handleRoute(async (request, response) => {
  const review = await loadReview(request, response);
  if (!review) return;
  const viewer = viewerOf(request);
  if (!canAssignReviewers({ ...viewer, review })) {
    return response.status(403).json({ error: 'Only the author or a workspace admin can assign reviewers.' });
  }

  const userIds = request.body?.userIds;
  if (!Array.isArray(userIds) || userIds.length > MAX_ASSIGNEES) {
    return response.status(400).json({ error: `Provide up to ${MAX_ASSIGNEES} reviewer ids.` });
  }
  const unique = [...new Set(userIds.map(String))];
  if (!unique.every(validId)) return response.status(400).json({ error: 'A reviewer id is invalid.' });

  const memberships = unique.length
    ? await WorkspaceMembership.find({
      organizationId: request.params.workspaceId,
      userId: { $in: unique },
    }).populate('userId', 'name email').lean()
    : [];
  if (memberships.length !== unique.length) {
    return response.status(400).json({ error: 'Every reviewer must be a member of this workspace.' });
  }
  if (memberships.some((member) => !isReviewerRole(member.role))) {
    return response.status(400).json({ error: 'Only reviewers, admins and owners can be assigned.' });
  }

  const assignees = memberships
    .filter((member) => member.userId)
    .map((member) => ({
      userId: member.userId._id,
      name: member.userId.name || member.userId.email || 'Member',
    }));

  const updated = await SharedReview.findOneAndUpdate(
    { _id: review._id, organizationId: request.params.workspaceId },
    { $set: { assignees } },
    { new: true },
  ).lean();

  await recordEvent(
    request,
    'review.assigned',
    review._id,
    assignees.length
      ? `Assigned reviewers: ${assignees.map((item) => item.name).join(', ')}.`
      : 'Cleared the assigned reviewers.',
  );
  return response.json(serialize(updated, viewer));
}));

router.post('/:reviewId/comments', handleRoute(async (request, response) => {
  const review = await loadReview(request, response);
  if (!review) return;

  const text = typeof request.body?.text === 'string' ? request.body.text.trim() : '';
  if (!text || text.length > 2000) {
    return response.status(400).json({ error: 'A comment must contain 1 to 2000 characters.' });
  }

  const actorName = await getActorName(request.userId);
  const updated = await SharedReview.findOneAndUpdate(
    {
      _id: review._id,
      organizationId: request.params.workspaceId,
      [`comments.${MAX_COMMENTS - 1}`]: { $exists: false },
    },
    { $push: { comments: { authorId: request.userId, authorName: actorName, text } } },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) return response.status(409).json({ error: 'This review has reached the comment limit.' });
  await recordEvent(request, 'review.commented', review._id, 'Added a comment.');
  return response.status(201).json(serialize(updated, viewerOf(request)));
}));

router.post('/:reviewId/decision', handleRoute(async (request, response) => {
  const review = await loadReview(request, response);
  if (!review) return;
  const viewer = viewerOf(request);

  const to = request.body?.status;
  if (!STATUSES.includes(to)) return response.status(400).json({ error: 'Unknown review status.' });
  const note = typeof request.body?.note === 'string' ? request.body.note.trim().slice(0, 500) : '';

  const check = canTransition({ ...viewer, review, to });
  if (!check.ok) {
    return response.status(check.code === 'INVALID_TRANSITION' ? 409 : 403).json({ error: check.reason });
  }
  if (to === 'Changes requested' && !note) {
    return response.status(400).json({ error: 'Add a note explaining what needs to change.' });
  }

  const actorName = await getActorName(request.userId);
  // status in the filter = if someone else moved it meanwhile, we fail instead of overwriting.
  const updated = await SharedReview.findOneAndUpdate(
    { _id: review._id, organizationId: request.params.workspaceId, status: review.status },
    {
      $set: { status: to },
      $push: {
        decisions: {
          $each: [{ status: to, actorId: request.userId, actorName, note }],
          $slice: -MAX_DECISIONS,
        },
      },
    },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) {
    return response.status(409).json({ error: 'Someone else just changed this review. Reload and try again.' });
  }
  await recordEvent(
    request,
    ACTION_BY_STATUS[to] || 'review.status_changed',
    review._id,
    `Status changed from "${review.status}" to "${to}".`,
  );
  return response.json(serialize(updated, viewer));
}));

router.get('/:reviewId/activity', handleRoute(async (request, response) => {
  const review = await loadReview(request, response);
  if (!review) return;
  const events = await AuditEvent.find({
    organizationId: request.params.workspaceId,
    resourceType: 'review',
    resourceId: String(review._id),
  })
    .populate('actorId', 'name email')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return response.json(events.map((event) => ({
    id: String(event._id),
    actor: event.actorId?.name || event.actorId?.email || 'Former member',
    action: event.action,
    summary: event.summary,
    createdAt: toMs(event.createdAt),
  })));
}));

router.delete('/:reviewId', handleRoute(async (request, response) => {
  const review = await loadReview(request, response);
  if (!review) return;
  if (!canDeleteReview({ ...viewerOf(request), review })) {
    return response.status(403).json({ error: 'Only the author or a workspace admin can delete this review.' });
  }
  await SharedReview.deleteOne({ _id: review._id, organizationId: request.params.workspaceId });
  await recordEvent(request, 'review.deleted', review._id, `Deleted a ${review.contentType} review.`);
  return response.status(204).end();
}));

module.exports = router;