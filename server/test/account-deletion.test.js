const test = require('node:test');
const assert = require('node:assert/strict');
const AuditEvent = require('../src/models/AuditEvent');
const GovernanceSource = require('../src/models/GovernanceSource');
const Organization = require('../src/models/Organization');
const User = require('../src/models/User');
const WorkspaceMembership = require('../src/models/WorkspaceMembership');
const { deleteAccount } = require('../src/controllers/auth.controller');

function stubModelMethods(t, replacements) {
  for (const [model, methods] of replacements) {
    for (const [name, replacement] of Object.entries(methods)) {
      const original = model[name];
      model[name] = replacement;
      t.after(() => { model[name] = original; });
    }
  }
}

function responseStub() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('does not delete accounts that own shared workspaces', async (t) => {
  let changedSharedData = false;
  stubModelMethods(t, [
    [User, { findById: () => ({ select: async () => ({ _id: 'user-1' }) }) }],
    [Organization, { exists: async () => ({ _id: 'workspace-1' }) }],
    [WorkspaceMembership, { deleteMany: async () => { changedSharedData = true; } }],
    [AuditEvent, { updateMany: async () => { changedSharedData = true; } }],
    [GovernanceSource, { updateMany: async () => { changedSharedData = true; } }],
  ]);
  const response = responseStub();

  await deleteAccount({ userId: 'user-1' }, response, (error) => { throw error; });

  assert.equal(response.statusCode, 409);
  assert.equal(changedSharedData, false);
});

test('deletes personal data and anonymizes shared audit attribution', async (t) => {
  const updates = [];
  let userDeleted = false;
  stubModelMethods(t, [
    [User, {
      findById: () => ({ select: async () => ({ _id: 'user-1' }) }),
      deleteOne: async () => { userDeleted = true; },
    }],
    [Organization, { exists: async () => null }],
    [WorkspaceMembership, { deleteMany: async (filter) => { updates.push(['memberships', filter]); } }],
    [AuditEvent, { updateMany: async (filter, update) => { updates.push(['audit', filter, update]); } }],
    [GovernanceSource, { updateMany: async (filter, update) => { updates.push(['sources', filter, update]); } }],
  ]);
  const response = responseStub();

  await deleteAccount({ userId: 'user-1' }, response, (error) => { throw error; });

  assert.equal(response.statusCode, 200);
  assert.equal(userDeleted, true);
  assert.ok(updates.some(([kind]) => kind === 'memberships'));
  assert.ok(updates.some(([kind, , update]) => kind === 'audit' && update.$set.actorId === null));
  assert.ok(updates.some(([kind, , update]) => kind === 'sources' && update.$set.createdBy === null));
});
