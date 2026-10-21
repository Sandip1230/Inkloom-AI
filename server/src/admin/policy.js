const MEMBER_ROLES = ['admin', 'reviewer', 'creator'];
const MIN_AUDIT_RETENTION_DAYS = 30;
const MAX_AUDIT_RETENTION_DAYS = 3650;

function isMemberRole(role) {
  return MEMBER_ROLES.includes(role);
}

function isValidAuditRetentionDays(days) {
  return Number.isInteger(days)
    && days >= MIN_AUDIT_RETENTION_DAYS
    && days <= MAX_AUDIT_RETENTION_DAYS;
}

function canManageMembers(role) {
  return role === 'owner' || role === 'admin';
}

function canAssignMemberRole(actorRole, requestedRole) {
  return canManageMembers(actorRole)
    && isMemberRole(requestedRole)
    && (requestedRole !== 'admin' || actorRole === 'owner');
}

function canManageMemberRole(actorRole, targetRole) {
  if (targetRole === 'owner') return false;
  if (actorRole === 'owner') return true;
  return actorRole === 'admin' && targetRole !== 'admin';
}

module.exports = {
  canAssignMemberRole,
  canManageMemberRole,
  canManageMembers,
  isMemberRole,
  isValidAuditRetentionDays,
};
