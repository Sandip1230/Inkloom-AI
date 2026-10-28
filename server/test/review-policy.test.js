const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransition, reviewPermissions } = require('../src/admin/reviewPolicy');

const review = (overrides = {}) => ({ status: 'Draft', createdBy: 'author', assignees: [], ...overrides });

test('author or admin can request approval, other creators cannot', () => {
  assert.equal(canTransition({ role: 'creator', userId: 'author', review: review(), to: 'Awaiting approval' }).ok, true);
  assert.equal(canTransition({ role: 'admin', userId: 'x', review: review(), to: 'Awaiting approval' }).ok, true);
  assert.equal(canTransition({ role: 'creator', userId: 'other', review: review(), to: 'Awaiting approval' }).ok, false);
});

test('creators can never approve or request changes', () => {
  const waiting = review({ status: 'Awaiting approval' });
  assert.equal(canTransition({ role: 'creator', userId: 'other', review: waiting, to: 'Approved' }).ok, false);
  assert.equal(canTransition({ role: 'creator', userId: 'other', review: waiting, to: 'Changes requested' }).ok, false);
});

test('reviewer cannot approve their own draft, owner can', () => {
  const waiting = review({ status: 'Awaiting approval', createdBy: 'rev1' });
  assert.equal(canTransition({ role: 'reviewer', userId: 'rev1', review: waiting, to: 'Approved' }).ok, false);
  assert.equal(canTransition({ role: 'owner', userId: 'rev1', review: waiting, to: 'Approved' }).ok, true);
});

test('when reviewers are assigned, only they (or admins) can decide', () => {
  const waiting = review({ status: 'Awaiting approval', assignees: [{ userId: 'rev1' }] });
  assert.equal(canTransition({ role: 'reviewer', userId: 'rev1', review: waiting, to: 'Approved' }).ok, true);
  assert.equal(canTransition({ role: 'reviewer', userId: 'rev2', review: waiting, to: 'Approved' }).ok, false);
  assert.equal(canTransition({ role: 'admin', userId: 'adm', review: waiting, to: 'Approved' }).ok, true);
});

test('invalid jumps are rejected', () => {
  const result = canTransition({ role: 'owner', userId: 'x', review: review(), to: 'Approved' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_TRANSITION');
});

test('only admins can reopen an approved review', () => {
  const approved = review({ status: 'Approved' });
  assert.equal(canTransition({ role: 'reviewer', userId: 'r', review: approved, to: 'Changes requested' }).ok, false);
  assert.equal(canTransition({ role: 'admin', userId: 'a', review: approved, to: 'Changes requested' }).ok, true);
});

test('permission flags follow role and ownership', () => {
  const flags = reviewPermissions({ role: 'creator', userId: 'author', review: review() });
  assert.equal(flags.edit, true);
  assert.equal(flags.assign, true);
  assert.equal(flags.requestApproval, true);
  assert.equal(flags.approve, false);
  const other = reviewPermissions({ role: 'creator', userId: 'other', review: review() });
  assert.equal(other.edit, false);
  assert.equal(other.comment, true);
});