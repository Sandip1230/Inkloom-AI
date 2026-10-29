const express = require('express');
const mongoose = require('mongoose');
const AuditEvent = require('../models/AuditEvent');
const GovernanceSource = require('../models/GovernanceSource');
const Organization = require('../models/Organization');
const User = require('../models/User');
const WorkspaceMembership = require('../models/WorkspaceMembership');
const requireAuth = require('../middleware/requireAuth');
const requireCompanyAdmin = require('../middleware/requireCompanyAdmin');
const {
  canAssignMemberRole,
  canManageMemberRole,
  canManageMembers,
  isMemberRole,
  isValidAuditRetentionDays,
} = require('../admin/policy');

const router = express.Router();
const SOURCE_KINDS = ['brand-guide', 'approved-facts', 'claim-evidence', 'terminology', 'asset-rules', 'other'];
const CONFIDENTIALITY_LEVELS = ['internal', 'confidential', 'public'];

router.use(requireAuth);

// Listing your workspaces stays open to every signed-in user (reviewers/creators need it to switch workspaces).
// Creating a workspace and everything under /workspaces/:workspaceId is for Company Admin accounts only.
router.use('/workspaces/:workspaceId', requireCompanyAdmin);

function validId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function versionSnapshot(source, editedBy, changeNote) {
  return {
    version: source.currentVersion,
    title: source.title,
    content: source.content,
    owner: source.owner,
    effectiveDate: source.effectiveDate,
    reviewDate: source.reviewDate,
    confidentiality: source.confidentiality,
    changeNote,
    editedBy,
    createdAt: new Date(),
  };
}

async function getMembership(request, response, allowReadOnly = false) {
  const { workspaceId } = request.params;
  if (!validId(workspaceId)) {
    response.status(400).json({ error: 'Workspace ID is invalid.' });
    return null;
  }

  const membership = await WorkspaceMembership.findOne({
    organizationId: workspaceId,
    userId: request.userId,
  });
  if (!membership) {
    response.status(404).json({ error: 'Workspace not found.' });
    return null;
  }
  if (!allowReadOnly && !canManageMembers(membership.role)) {
    response.status(403).json({ error: 'Only workspace owners and admins can make this change.' });
    return null;
  }
  return membership;
}

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && Boolean(value.trim()) && value.trim().length <= maxLength;
}

async function recordEvent(organizationId, actorId, action, resourceType, resourceId, summary) {
  await AuditEvent.create({ organizationId, actorId, action, resourceType, resourceId, summary });
}

function handleRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

router.get('/workspaces', handleRoute(async (request, response) => {
  const memberships = await WorkspaceMembership.find({ userId: request.userId })
    .populate('organizationId', 'name auditRetentionDays createdAt')
    .lean();
  return response.json(memberships
    .filter((membership) => membership.organizationId)
    .map((membership) => ({
      ...membership.organizationId,
      role: membership.role,
    })));
}));

router.post('/workspaces', requireCompanyAdmin, handleRoute(async (request, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
  if (!name || name.length > 120) {
    return response.status(400).json({ error: 'Workspace name must contain 1 to 120 characters.' });
  }

  const organization = await Organization.create({ name, ownerId: request.userId });
  await WorkspaceMembership.create({
    organizationId: organization._id,
    userId: request.userId,
    role: 'owner',
  });
  await recordEvent(organization._id, request.userId, 'workspace.created', 'workspace', organization._id, 'Created the workspace.');
  return response.status(201).json({ ...organization.toObject(), role: 'owner' });
}));

router.get('/workspaces/:workspaceId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response, true);
  if (!membership) return;

  const organization = await Organization.findById(request.params.workspaceId).lean();
  if (!organization) return response.status(404).json({ error: 'Workspace not found.' });

  const [members, sources, activity] = await Promise.all([
    WorkspaceMembership.find({ organizationId: organization._id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 })
      .lean(),
    GovernanceSource.find({ organizationId: organization._id })
      .select('kind title owner effectiveDate reviewDate confidentiality currentVersion versions.version versions.title versions.owner versions.effectiveDate versions.reviewDate versions.confidentiality versions.changeNote versions.editedBy versions.createdAt createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean(),
    AuditEvent.find({ organizationId: organization._id })
      .populate('actorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return response.json({
    ...organization,
    role: membership.role,
    members: members.map((member) => ({
      id: member.userId?._id,
      name: member.userId?.name || 'Deleted account',
      email: member.userId?.email || '',
      avatar: member.userId?.avatar || null,
      role: member.role,
      joinedAt: member.createdAt,
    })),
    sources,
    activity: activity.map((event) => ({
      id: event._id,
      actor: event.actorId?.name || event.actorId?.email || 'Former member',
      action: event.action,
      summary: event.summary,
      createdAt: event.createdAt,
    })),
  });
}));

router.patch('/workspaces/:workspaceId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;

  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
  if (!name || name.length > 120) {
    return response.status(400).json({ error: 'Workspace name must contain 1 to 120 characters.' });
  }
  const organization = await Organization.findByIdAndUpdate(
    request.params.workspaceId,
    { $set: { name } },
    { new: true, runValidators: true },
  );
  if (!organization) return response.status(404).json({ error: 'Workspace not found.' });
  await recordEvent(organization._id, request.userId, 'workspace.updated', 'workspace', organization._id, 'Updated workspace details.');
  return response.json({ ...organization.toObject(), role: membership.role });
}));

router.post('/workspaces/:workspaceId/members', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;

  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const role = request.body?.role;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isMemberRole(role)) {
    return response.status(400).json({ error: 'Provide a valid registered email and a role of admin, reviewer, or creator.' });
  }
  if (!canAssignMemberRole(membership.role, role)) {
    return response.status(403).json({ error: 'Only the workspace owner can assign the admin role.' });
  }

  const user = await User.findOne({ email }).select('_id name email avatar');
  if (!user) return response.status(404).json({ error: 'That email does not belong to a registered Inkloom account yet.' });

  const existing = await WorkspaceMembership.findOne({
    organizationId: request.params.workspaceId,
    userId: user._id,
  });
  if (existing) return response.status(409).json({ error: 'That account is already a workspace member.' });

  await WorkspaceMembership.create({
    organizationId: request.params.workspaceId,
    userId: user._id,
    role,
  });
  await recordEvent(request.params.workspaceId, request.userId, 'member.added', 'member', user._id, `Added ${user.email} as ${role}.`);
  return response.status(201).json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar || null, role });
}));

router.patch('/workspaces/:workspaceId/members/:memberId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  if (!validId(request.params.memberId)) return response.status(400).json({ error: 'Member ID is invalid.' });

  const target = await WorkspaceMembership.findOne({
    organizationId: request.params.workspaceId,
    userId: request.params.memberId,
  });
  if (!target) return response.status(404).json({ error: 'Workspace member not found.' });
  const role = request.body?.role;
  if (!isMemberRole(role)) return response.status(400).json({ error: 'Choose admin, reviewer, or creator.' });
  if (!canManageMemberRole(membership.role, target.role) || !canAssignMemberRole(membership.role, role)) {
    if (target.role === 'owner') return response.status(403).json({ error: 'The workspace owner role cannot be changed here.' });
    return response.status(403).json({ error: 'Only the workspace owner can change admin access.' });
  }

  target.role = role;
  await target.save();
  const user = await User.findById(target.userId).select('name email avatar').lean();
  await recordEvent(request.params.workspaceId, request.userId, 'member.role_updated', 'member', target.userId, `Changed ${user?.email || 'a member'} to ${role}.`);
  return response.json({ id: target.userId, name: user?.name || 'Member', email: user?.email || '', avatar: user?.avatar || null, role });
}));

router.delete('/workspaces/:workspaceId/members/:memberId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  if (!validId(request.params.memberId)) return response.status(400).json({ error: 'Member ID is invalid.' });

  const target = await WorkspaceMembership.findOne({
    organizationId: request.params.workspaceId,
    userId: request.params.memberId,
  });
  if (!target) return response.status(404).json({ error: 'Workspace member not found.' });
  if (!canManageMemberRole(membership.role, target.role)) {
    if (target.role === 'owner') return response.status(403).json({ error: 'The workspace owner cannot be removed.' });
    return response.status(403).json({ error: 'Only the workspace owner can remove an admin.' });
  }

  const user = await User.findById(target.userId).select('email').lean();
  await target.deleteOne();
  await recordEvent(request.params.workspaceId, request.userId, 'member.removed', 'member', target.userId, `Removed ${user?.email || 'a member'}.`);
  return response.status(204).end();
}));

router.post('/workspaces/:workspaceId/sources', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;

  const { kind, title, content, owner, effectiveDate, reviewDate, confidentiality, changeNote } = request.body || {};
  const effective = toIsoDate(effectiveDate);
  const review = toIsoDate(reviewDate);
  if (!SOURCE_KINDS.includes(kind) || !isNonEmptyString(title, 160)
    || typeof content !== 'string' || !content.trim() || content.length > 50000
    || !isNonEmptyString(owner, 160)
    || !effective || effective === null || (reviewDate && !review)
    || !CONFIDENTIALITY_LEVELS.includes(confidentiality)) {
    return response.status(400).json({ error: 'Provide a valid source type, title, content, owner, effective date, and confidentiality level.' });
  }

  const source = await GovernanceSource.create({
    organizationId: request.params.workspaceId,
    kind,
    title: title.trim(),
    content: content.trim(),
    owner: owner.trim(),
    effectiveDate: effective,
    reviewDate: review,
    confidentiality,
    currentVersion: 1,
    createdBy: request.userId,
    versions: [{
      version: 1,
      title: title.trim(),
      content: content.trim(),
      owner: owner.trim(),
      effectiveDate: effective,
      reviewDate: review,
      confidentiality,
      changeNote: typeof changeNote === 'string' ? changeNote.trim() || 'Initial version' : 'Initial version',
      editedBy: request.userId,
    }],
  });
  await recordEvent(request.params.workspaceId, request.userId, 'source.created', 'source', source._id, `Added source: ${source.title}.`);
  return response.status(201).json(source);
}));

router.get('/workspaces/:workspaceId/sources/:sourceId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response, true);
  if (!membership) return;
  if (!validId(request.params.sourceId)) return response.status(400).json({ error: 'Source ID is invalid.' });

  const source = await GovernanceSource.findOne({
    _id: request.params.sourceId,
    organizationId: request.params.workspaceId,
  }).populate('versions.editedBy', 'name email').lean();
  if (!source) return response.status(404).json({ error: 'Governance source not found.' });
  return response.json(source);
}));

router.patch('/workspaces/:workspaceId/sources/:sourceId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  if (!validId(request.params.sourceId)) return response.status(400).json({ error: 'Source ID is invalid.' });

  const source = await GovernanceSource.findOne({
    _id: request.params.sourceId,
    organizationId: request.params.workspaceId,
  });
  if (!source) return response.status(404).json({ error: 'Governance source not found.' });

  const { kind, title, content, owner, effectiveDate, reviewDate, confidentiality, changeNote } = request.body || {};
  const effective = effectiveDate === undefined ? source.effectiveDate : toIsoDate(effectiveDate);
  const review = reviewDate === undefined ? source.reviewDate : toIsoDate(reviewDate);
  const nextKind = kind === undefined ? source.kind : kind;
  const nextTitle = title === undefined ? source.title : typeof title === 'string' ? title.trim() : title;
  const nextContent = content === undefined ? source.content : content;
  const nextOwner = owner === undefined ? source.owner : typeof owner === 'string' ? owner.trim() : owner;
  const nextConfidentiality = confidentiality === undefined ? source.confidentiality : confidentiality;

  if (!SOURCE_KINDS.includes(nextKind) || !isNonEmptyString(nextTitle, 160)
    || typeof nextContent !== 'string' || !nextContent.trim() || nextContent.length > 50000
    || !isNonEmptyString(nextOwner, 160)
    || !effective || effective === null || (reviewDate && !review)
    || !CONFIDENTIALITY_LEVELS.includes(nextConfidentiality)) {
    return response.status(400).json({ error: 'The source update contains invalid fields.' });
  }

  source.currentVersion += 1;
  source.kind = nextKind;
  source.title = nextTitle;
  source.content = nextContent.trim();
  source.owner = nextOwner;
  source.effectiveDate = effective;
  source.reviewDate = review;
  source.confidentiality = nextConfidentiality;
  source.versions.push(versionSnapshot(
    source,
    request.userId,
    typeof changeNote === 'string' ? changeNote.trim() : undefined,
  ));
  await source.save();
  await recordEvent(request.params.workspaceId, request.userId, 'source.version_created', 'source', source._id, `Created version ${source.currentVersion} of ${source.title}.`);
  return response.json(source);
}));

router.delete('/workspaces/:workspaceId/sources/:sourceId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  if (!validId(request.params.sourceId)) return response.status(400).json({ error: 'Source ID is invalid.' });

  const source = await GovernanceSource.findOneAndDelete({
    _id: request.params.sourceId,
    organizationId: request.params.workspaceId,
  });
  if (!source) return response.status(404).json({ error: 'Governance source not found.' });
  await recordEvent(request.params.workspaceId, request.userId, 'source.deleted', 'source', source._id, `Deleted source: ${source.title}.`);
  return response.status(204).end();
}));

router.patch('/workspaces/:workspaceId/retention', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;

  const { auditRetentionDays } = request.body || {};
  if (!isValidAuditRetentionDays(auditRetentionDays)) {
    return response.status(400).json({ error: 'Audit retention must be a whole number between 30 and 3650 days.' });
  }
  const organization = await Organization.findByIdAndUpdate(
    request.params.workspaceId,
    { $set: { auditRetentionDays } },
    { new: true, runValidators: true },
  );
  if (!organization) return response.status(404).json({ error: 'Workspace not found.' });
  await recordEvent(organization._id, request.userId, 'retention.updated', 'workspace', organization._id, `Set audit-event retention to ${auditRetentionDays} days.`);
  return response.json({ auditRetentionDays: organization.auditRetentionDays });
}));

router.get('/workspaces/:workspaceId/activity', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response, true);
  if (!membership) return;

  const organization = await Organization.findById(request.params.workspaceId).select('auditRetentionDays');
  if (!organization) return response.status(404).json({ error: 'Workspace not found.' });
  const expiresBefore = new Date(Date.now() - organization.auditRetentionDays * 24 * 60 * 60 * 1000);
  await AuditEvent.deleteMany({ organizationId: organization._id, createdAt: { $lt: expiresBefore } });

  const activity = await AuditEvent.find({ organizationId: organization._id })
    .populate('actorId', 'name email')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return response.json(activity.map((event) => ({
    id: event._id,
    actor: event.actorId?.name || event.actorId?.email || 'Former member',
    action: event.action,
    summary: event.summary,
    createdAt: event.createdAt,
  })));
}));

module.exports = router;
