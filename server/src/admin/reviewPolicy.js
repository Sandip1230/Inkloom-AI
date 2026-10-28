const STATUSES = ['Draft', 'Awaiting approval', 'Changes requested', 'Approved'];

const TRANSITIONS = {
  Draft: ['Awaiting approval'],
  'Changes requested': ['Awaiting approval'],
  'Awaiting approval': ['Approved', 'Changes requested'],
  Approved: ['Changes requested'],
};

const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const isManager = (role) => role === 'owner' || role === 'admin';
const isReviewerRole = (role) => isManager(role) || role === 'reviewer';
const isAuthor = (review, userId) => sameId(review.createdBy, userId);
const isAssigned = (review, userId) => (
  (review.assignees || []).some((item) => sameId(item.userId || item.id, userId))
);

function canEditReview({ role, userId, review }) {
  return isManager(role) || isAuthor(review, userId);
}

function canAssignReviewers({ role, userId, review }) {
  return isManager(role) || isAuthor(review, userId);
}

function canDeleteReview({ role, userId, review }) {
  return isManager(role) || isAuthor(review, userId);
}

function canTransition({ role, userId, review, to }) {
  const allowed = TRANSITIONS[review.status] || [];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      reason: `A review that is "${review.status}" cannot move to "${to}".`,
    };
  }

  if (to === 'Awaiting approval') {
    if (isManager(role) || isAuthor(review, userId)) return { ok: true };
    return { ok: false, code: 'FORBIDDEN', reason: 'Only the author or a workspace admin can request approval.' };
  }

  // From here: "Approved" or "Changes requested" are reviewer decisions.
  if (!isReviewerRole(role)) {
    return { ok: false, code: 'FORBIDDEN', reason: 'Only reviewers and admins can make this decision.' };
  }
  if (review.status === 'Approved') {
    return isManager(role)
      ? { ok: true }
      : { ok: false, code: 'FORBIDDEN', reason: 'Only a workspace admin can reopen an approved review.' };
  }
  const hasAssignees = (review.assignees || []).length > 0;
  if (!isManager(role) && hasAssignees && !isAssigned(review, userId)) {
    return { ok: false, code: 'FORBIDDEN', reason: 'This review is assigned to other reviewers.' };
  }
  if (to === 'Approved' && isAuthor(review, userId) && role !== 'owner') {
    return { ok: false, code: 'FORBIDDEN', reason: 'You cannot approve your own draft.' };
  }
  return { ok: true };
}

function reviewPermissions({ role, userId, review }) {
  const ctx = { role, userId, review };
  return {
    edit: canEditReview(ctx),
    assign: canAssignReviewers(ctx),
    delete: canDeleteReview(ctx),
    comment: true,
    requestApproval: canTransition({ ...ctx, to: 'Awaiting approval' }).ok,
    requestChanges: canTransition({ ...ctx, to: 'Changes requested' }).ok,
    approve: canTransition({ ...ctx, to: 'Approved' }).ok,
  };
}

module.exports = {
  STATUSES,
  canAssignReviewers,
  canDeleteReview,
  canEditReview,
  canTransition,
  isReviewerRole,
  reviewPermissions,
};