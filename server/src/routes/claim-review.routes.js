const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const AuditEvent = require('../models/AuditEvent');
const ClaimReview = require('../models/ClaimReview');
const ReferenceDocument = require('../models/ReferenceDocument');
const User = require('../models/User');
const WorkspaceMembership = require('../models/WorkspaceMembership');
const requireAuth = require('../middleware/requireAuth');
const { createAIClient } = require('../ai/client');
const { retrieveEvidence } = require('../claimReview/retrieval');
const { analyzeClaim, STATUSES } = require('../claimReview/analysis');

const router = express.Router();

const MAX_DOC_CHARS = 200000;
const MAX_CLAIM_CHARS = 2000;
const VERSION_FIELDS_NO_CONTENT = '-versions.content';

router.use(requireAuth);

// ---- permissions ---------------------------------------------------------
// Everyone in the workspace can submit and read claims. Only owners/admins
// manage and approve reference documents. Owners, admins and reviewers make
// the final human decision on a claim.
const canManageDocuments = (role) => role === 'owner' || role === 'admin';
const canReviewClaims = (role) => role === 'owner' || role === 'admin' || role === 'reviewer';

function validId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function handleRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

async function getMembership(request, response, check) {
  const { workspaceId } = request.params;
  if (!validId(workspaceId)) {
    response.status(400).json({ error: 'Workspace ID is invalid.' });
    return null;
  }
  const membership = await WorkspaceMembership.findOne({ organizationId: workspaceId, userId: request.userId });
  if (!membership) {
    response.status(404).json({ error: 'Workspace not found.' });
    return null;
  }
  if (check && !check(membership.role)) {
    response.status(403).json({ error: check === canManageDocuments
      ? 'Only workspace owners and admins can manage reference documents.'
      : 'Only workspace owners, admins, and reviewers can record a final decision.' });
    return null;
  }
  return membership;
}

async function recordEvent(organizationId, actorId, action, resourceType, resourceId, summary) {
  try {
    await AuditEvent.create({
      organizationId,
      actorId,
      action,
      resourceType,
      resourceId: String(resourceId),
      summary: String(summary).slice(0, 240),
    });
  } catch (error) {
    // The audit log must never break the main action; the claim's own history is the primary trail.
    console.error('[claim-review] Could not write audit event:', error.message);
  }
}

async function actorName(userId) {
  const user = await User.findById(userId).select('name email').lean();
  return user?.name || user?.email || 'Unknown user';
}

const isNonEmptyString = (value, max) => typeof value === 'string' && Boolean(value.trim()) && value.trim().length <= max;
const hashContent = (content) => crypto.createHash('sha256').update(content).digest('hex');

// The version a document currently contributes to search: its newest APPROVED version.
function activeVersionOf(doc) {
  if (doc.status !== 'active') return null;
  const approved = (doc.versions || []).filter((version) => version.approvalStatus === 'approved');
  if (!approved.length) return null;
  return approved.reduce((latest, version) => (version.version > latest.version ? version : latest));
}

function serializeDocument(doc) {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const active = activeVersionOf(plain);
  const current = (plain.versions || []).find((version) => version.version === plain.currentVersion);
  return {
    _id: plain._id,
    title: plain.title,
    owner: plain.owner,
    description: plain.description || '',
    status: plain.status,
    currentVersion: plain.currentVersion,
    currentApprovalStatus: current?.approvalStatus || 'pending',
    activeVersion: active ? active.version : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    versions: (plain.versions || []).map((version) => ({
      version: version.version,
      approvalStatus: version.approvalStatus,
      changeNote: version.changeNote || '',
      sourceFileName: version.sourceFileName || '',
      contentHash: version.contentHash,
      uploadedBy: version.uploadedBy,
      uploadedAt: version.uploadedAt,
      decidedBy: version.decidedBy,
      decidedAt: version.decidedAt,
    })).sort((a, b) => b.version - a.version),
  };
}

function serializeClaim(claim, { light = false } = {}) {
  const plain = typeof claim.toObject === 'function' ? claim.toObject() : claim;
  const base = {
    _id: plain._id,
    claim: plain.claim,
    submittedByName: plain.submittedByName,
    suggestion: plain.suggestion,
    reviewState: plain.reviewState,
    finalDecision: plain.finalDecision?.status ? plain.finalDecision : null,
    evidenceCount: (plain.evidence || []).length,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
  if (light) return base;
  return { ...base, evidence: plain.evidence || [], history: plain.history || [] };
}

function validateDocumentFields(body, { requireContent }) {
  const { title, owner, description, content, sourceFileName, changeNote } = body || {};
  if (!isNonEmptyString(title, 160)) return 'Title must contain 1 to 160 characters.';
  if (!isNonEmptyString(owner, 160)) return 'An owner (person or team responsible for the source) is required.';
  if (description !== undefined && (typeof description !== 'string' || description.length > 500)) return 'Description must be 500 characters or fewer.';
  if (sourceFileName !== undefined && (typeof sourceFileName !== 'string' || sourceFileName.length > 255)) return 'File name is too long.';
  if (changeNote !== undefined && (typeof changeNote !== 'string' || changeNote.length > 500)) return 'Change note must be 500 characters or fewer.';
  if (requireContent && (typeof content !== 'string' || !content.trim() || content.length > MAX_DOC_CHARS)) {
    return `Document text must contain between 1 and ${MAX_DOC_CHARS.toLocaleString('en-US')} characters.`;
  }
  return null;
}

// ---- reference documents ---------------------------------------------------

router.get('/workspaces/:workspaceId/documents', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  const documents = await ReferenceDocument.find({ organizationId: request.params.workspaceId })
    .select(VERSION_FIELDS_NO_CONTENT)
    .sort({ updatedAt: -1 })
    .lean();
  return response.json({ role: membership.role, documents: documents.map(serializeDocument) });
}));

router.post('/workspaces/:workspaceId/documents', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response, canManageDocuments);
  if (!membership) return;
  const problem = validateDocumentFields(request.body, { requireContent: true });
  if (problem) return response.status(400).json({ error: problem });

  const { title, owner, description = '', content, sourceFileName = '', changeNote, approve } = request.body;
  const trimmed = content.trim();
  const approved = approve === true;
  const doc = await ReferenceDocument.create({
    organizationId: request.params.workspaceId,
    title: title.trim(),
    owner: owner.trim(),
    description: description.trim(),
    currentVersion: 1,
    createdBy: request.userId,
    versions: [{
      version: 1,
      content: trimmed,
      contentHash: hashContent(trimmed),
      changeNote: (changeNote || '').trim() || 'Initial version',
      sourceFileName: sourceFileName.trim(),
      approvalStatus: approved ? 'approved' : 'pending',
      uploadedBy: request.userId,
      decidedBy: approved ? request.userId : null,
      decidedAt: approved ? new Date() : null,
    }],
  });
  await recordEvent(doc.organizationId, request.userId, 'reference.created', 'reference-document', doc._id,
    `Added reference document "${doc.title}" v1${approved ? ' (approved)' : ' (pending approval)'}.`);
  return response.status(201).json(serializeDocument(doc));
}));

router.get('/workspaces/:workspaceId/documents/:documentId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  if (!validId(request.params.documentId)) return response.status(400).json({ error: 'Document ID is invalid.' });
  const doc = await ReferenceDocument.findOne({ _id: request.params.documentId, organizationId: request.params.workspaceId })
    .select(VERSION_FIELDS_NO_CONTENT).lean();
  if (!doc) return response.status(404).json({ error: 'Reference document not found.' });
  return response.json(serializeDocument(doc));
}));

router.get('/workspaces/:workspaceId/documents/:documentId/versions/:version', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  const versionNumber = Number(request.params.version);
  if (!validId(request.params.documentId) || !Number.isInteger(versionNumber)) {
    return response.status(400).json({ error: 'Document or version is invalid.' });
  }
  const doc = await ReferenceDocument.findOne({ _id: request.params.documentId, organizationId: request.params.workspaceId }).lean();
  const version = doc?.versions.find((item) => item.version === versionNumber);
  if (!version) return response.status(404).json({ error: 'Document version not found.' });
  return response.json({ documentId: doc._id, title: doc.title, owner: doc.owner, ...version });
}));

router.patch('/workspaces/:workspaceId/documents/:documentId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response, canManageDocuments);
  if (!membership) return;
  if (!validId(request.params.documentId)) return response.status(400).json({ error: 'Document ID is invalid.' });
  const doc = await ReferenceDocument.findOne({ _id: request.params.documentId, organizationId: request.params.workspaceId });
  if (!doc) return response.status(404).json({ error: 'Reference document not found.' });

  const { title, owner, description, status } = request.body || {};
  if (title !== undefined && !isNonEmptyString(title, 160)) return response.status(400).json({ error: 'Title must contain 1 to 160 characters.' });
  if (owner !== undefined && !isNonEmptyString(owner, 160)) return response.status(400).json({ error: 'Owner must contain 1 to 160 characters.' });
  if (description !== undefined && (typeof description !== 'string' || description.length > 500)) return response.status(400).json({ error: 'Description must be 500 characters or fewer.' });
  if (status !== undefined && !['active', 'retired'].includes(status)) return response.status(400).json({ error: 'Status must be active or retired.' });

  const changes = [];
  if (title !== undefined && title.trim() !== doc.title) { doc.title = title.trim(); changes.push('title'); }
  if (owner !== undefined && owner.trim() !== doc.owner) { doc.owner = owner.trim(); changes.push('owner'); }
  if (description !== undefined && description.trim() !== doc.description) { doc.description = description.trim(); changes.push('description'); }
  if (status !== undefined && status !== doc.status) { doc.status = status; changes.push(status === 'retired' ? 'retired' : 'restored'); }
  if (changes.length) {
    await doc.save();
    await recordEvent(doc.organizationId, request.userId, 'reference.updated', 'reference-document', doc._id,
      `Updated reference document "${doc.title}" (${changes.join(', ')}).`);
  }
  const fresh = await ReferenceDocument.findById(doc._id).select(VERSION_FIELDS_NO_CONTENT).lean();
  return response.json(serializeDocument(fresh));
}));

router.post('/workspaces/:workspaceId/documents/:documentId/versions', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response, canManageDocuments);
  if (!membership) return;
  if (!validId(request.params.documentId)) return response.status(400).json({ error: 'Document ID is invalid.' });
  const doc = await ReferenceDocument.findOne({ _id: request.params.documentId, organizationId: request.params.workspaceId });
  if (!doc) return response.status(404).json({ error: 'Reference document not found.' });

  const { content, sourceFileName = '', changeNote, approve } = request.body || {};
  if (typeof content !== 'string' || !content.trim() || content.length > MAX_DOC_CHARS) {
    return response.status(400).json({ error: `Document text must contain between 1 and ${MAX_DOC_CHARS.toLocaleString('en-US')} characters.` });
  }
  if (typeof sourceFileName !== 'string' || sourceFileName.length > 255 || (changeNote !== undefined && (typeof changeNote !== 'string' || changeNote.length > 500))) {
    return response.status(400).json({ error: 'File name or change note is invalid.' });
  }

  const trimmed = content.trim();
  const approved = approve === true;
  const nextVersion = doc.currentVersion + 1;
  doc.currentVersion = nextVersion;
  doc.versions.push({
    version: nextVersion,
    content: trimmed,
    contentHash: hashContent(trimmed),
    changeNote: (changeNote || '').trim() || `Version ${nextVersion}`,
    sourceFileName: sourceFileName.trim(),
    approvalStatus: approved ? 'approved' : 'pending',
    uploadedBy: request.userId,
    decidedBy: approved ? request.userId : null,
    decidedAt: approved ? new Date() : null,
  });
  await doc.save();
  await recordEvent(doc.organizationId, request.userId, 'reference.version_created', 'reference-document', doc._id,
    `Added v${nextVersion} of "${doc.title}"${approved ? ' (approved)' : ' (pending approval)'}.`);
  const fresh = await ReferenceDocument.findById(doc._id).select(VERSION_FIELDS_NO_CONTENT).lean();
  return response.status(201).json(serializeDocument(fresh));
}));

router.post('/workspaces/:workspaceId/documents/:documentId/versions/:version/decision', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response, canManageDocuments);
  if (!membership) return;
  const versionNumber = Number(request.params.version);
  const { decision } = request.body || {};
  if (!validId(request.params.documentId) || !Number.isInteger(versionNumber)) {
    return response.status(400).json({ error: 'Document or version is invalid.' });
  }
  if (!['approved', 'rejected'].includes(decision)) {
    return response.status(400).json({ error: 'Decision must be approved or rejected.' });
  }
  const doc = await ReferenceDocument.findOne({ _id: request.params.documentId, organizationId: request.params.workspaceId });
  const version = doc?.versions.find((item) => item.version === versionNumber);
  if (!version) return response.status(404).json({ error: 'Document version not found.' });

  version.approvalStatus = decision;
  version.decidedBy = request.userId;
  version.decidedAt = new Date();
  doc.markModified('versions');
  await doc.save();
  await recordEvent(doc.organizationId, request.userId, `reference.version_${decision}`, 'reference-document', doc._id,
    `${decision === 'approved' ? 'Approved' : 'Rejected'} v${versionNumber} of "${doc.title}".`);
  const fresh = await ReferenceDocument.findById(doc._id).select(VERSION_FIELDS_NO_CONTENT).lean();
  return response.json(serializeDocument(fresh));
}));

// ---- claims -------------------------------------------------------------------

const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many claim submissions. Wait a few minutes and try again.' },
});

router.post('/workspaces/:workspaceId/claims', claimLimiter, handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;

  const claimText = request.body?.claim;
  if (typeof claimText !== 'string' || claimText.trim().length < 5 || claimText.trim().length > MAX_CLAIM_CHARS) {
    return response.status(400).json({ error: `Claim must contain between 5 and ${MAX_CLAIM_CHARS} characters.` });
  }
  const claim = claimText.trim();

  // 1. Only approved versions of active documents are searchable.
  const documents = await ReferenceDocument.find({ organizationId: request.params.workspaceId, status: 'active' }).lean();
  const searchable = documents.map((doc) => {
    const version = activeVersionOf(doc);
    return version ? {
      documentId: doc._id,
      title: doc.title,
      owner: doc.owner,
      version: version.version,
      contentHash: version.contentHash,
      content: version.content,
    } : null;
  }).filter(Boolean);

  // 2. Retrieve evidence, 3. analyse it (never fails the request: worst case Unverified).
  const evidence = retrieveEvidence(claim, searchable);
  let complete;
  let model = '';
  if (evidence.length) {
    try {
      ({ complete } = createAIClient());
      model = process.env.AI_MODEL || process.env.OPENROUTER_MODEL || '';
    } catch {
      complete = undefined;
    }
  }
  const analysis = await analyzeClaim({ claim, evidence, complete, model });

  const evidenceRecords = evidence.map((item, index) => {
    const relation = analysis.relations.find((entry) => entry.index === index);
    return { ...item, relation: relation?.relation || (analysis.method === 'ai' ? 'neutral' : 'unassessed'), quote: relation?.quote || '' };
  });

  const submitter = await actorName(request.userId);
  const now = new Date();
  const record = await ClaimReview.create({
    organizationId: request.params.workspaceId,
    claim,
    submittedBy: request.userId,
    submittedByName: submitter,
    evidence: evidenceRecords,
    suggestion: { status: analysis.status, rationale: analysis.rationale, method: analysis.method, model: analysis.model, generatedAt: now },
    history: [
      { action: 'submitted', by: request.userId, byName: submitter, at: now },
      { action: 'suggested', status: analysis.status, byName: analysis.method === 'ai' ? `AI (${analysis.model || 'model'})` : 'System', notes: analysis.rationale, at: now },
    ],
  });
  await recordEvent(record.organizationId, request.userId, 'claim.submitted', 'claim-review', record._id,
    `Submitted claim for review (suggested ${analysis.status}): ${claim}`);
  return response.status(201).json(serializeClaim(record));
}));

router.get('/workspaces/:workspaceId/claims', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  const filter = { organizationId: request.params.workspaceId };
  if (request.query.reviewState === 'pending' || request.query.reviewState === 'reviewed') filter.reviewState = request.query.reviewState;
  const claims = await ClaimReview.find(filter)
    .select('-evidence -history')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return response.json({ role: membership.role, claims: claims.map((item) => serializeClaim(item, { light: true })) });
}));

router.get('/workspaces/:workspaceId/claims/:claimId', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response);
  if (!membership) return;
  if (!validId(request.params.claimId)) return response.status(400).json({ error: 'Claim ID is invalid.' });
  const claim = await ClaimReview.findOne({ _id: request.params.claimId, organizationId: request.params.workspaceId }).lean();
  if (!claim) return response.status(404).json({ error: 'Claim not found.' });
  return response.json(serializeClaim(claim));
}));

router.post('/workspaces/:workspaceId/claims/:claimId/review', handleRoute(async (request, response) => {
  const membership = await getMembership(request, response, canReviewClaims);
  if (!membership) return;
  if (!validId(request.params.claimId)) return response.status(400).json({ error: 'Claim ID is invalid.' });

  const { status, notes = '' } = request.body || {};
  if (!STATUSES.includes(status)) return response.status(400).json({ error: 'Status must be Supported, Contradicted, or Unverified.' });
  if (typeof notes !== 'string' || notes.length > 1000) return response.status(400).json({ error: 'Review notes must be 1000 characters or fewer.' });

  const claim = await ClaimReview.findOne({ _id: request.params.claimId, organizationId: request.params.workspaceId });
  if (!claim) return response.status(404).json({ error: 'Claim not found.' });

  const reviewer = await actorName(request.userId);
  const previousStatus = claim.finalDecision?.status || null;
  const changed = status !== claim.suggestion.status;
  const now = new Date();
  claim.reviewState = 'reviewed';
  claim.finalDecision = {
    status,
    notes: notes.trim(),
    reviewer: request.userId,
    reviewerName: reviewer,
    reviewedAt: now,
    changedFromSuggestion: changed,
  };
  claim.history.push({ action: 'reviewed', status, previousStatus, by: request.userId, byName: reviewer, notes: notes.trim(), at: now });
  await claim.save();
  await recordEvent(claim.organizationId, request.userId, 'claim.reviewed', 'claim-review', claim._id,
    `${changed ? 'Changed' : 'Confirmed'} claim decision to ${status}: ${claim.claim}`);
  return response.json(serializeClaim(claim));
}));

module.exports = router;