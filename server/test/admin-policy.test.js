const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canAssignMemberRole,
  canManageMemberRole,
  canManageMembers,
  isMemberRole,
  isValidAuditRetentionDays,
} = require('../src/admin/policy');

test('workspace member roles are limited to assignable roles', () => {
  assert.equal(isMemberRole('admin'), true);
  assert.equal(isMemberRole('reviewer'), true);
  assert.equal(isMemberRole('creator'), true);
  assert.equal(isMemberRole('owner'), false);
  assert.equal(isMemberRole('unknown'), false);
});

test('only workspace owners and admins can manage members', () => {
  assert.equal(canManageMembers('owner'), true);
  assert.equal(canManageMembers('admin'), true);
  assert.equal(canManageMembers('reviewer'), false);
  assert.equal(canManageMembers('creator'), false);
});

test('only owners can grant or change admin access, and no one can change the owner role', () => {
  assert.equal(canAssignMemberRole('owner', 'admin'), true);
  assert.equal(canAssignMemberRole('admin', 'admin'), false);
  assert.equal(canAssignMemberRole('reviewer', 'creator'), false);
  assert.equal(canManageMemberRole('owner', 'admin'), true);
  assert.equal(canManageMemberRole('admin', 'reviewer'), true);
  assert.equal(canManageMemberRole('admin', 'admin'), false);
  assert.equal(canManageMemberRole('owner', 'owner'), false);
});

test('audit retention accepts whole days from 30 to 3650', () => {
  assert.equal(isValidAuditRetentionDays(30), true);
  assert.equal(isValidAuditRetentionDays(365), true);
  assert.equal(isValidAuditRetentionDays(3650), true);
  assert.equal(isValidAuditRetentionDays(29), false);
  assert.equal(isValidAuditRetentionDays(3651), false);
  assert.equal(isValidAuditRetentionDays(365.5), false);
  assert.equal(isValidAuditRetentionDays('365'), false);
});
