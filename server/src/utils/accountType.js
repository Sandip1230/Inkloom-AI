const Organization = require('../models/Organization');

/**
 * Returns 'admin' or 'user' for a User document.
 *
 * - Accounts created through the sign-up form store their choice in `accountType`.
 * - Older accounts (created before account types existed) have no value. If such an
 *   account already owns a company workspace it is upgraded to 'admin' once and saved,
 *   otherwise it is treated as a normal 'user'.
 */
async function resolveAccountType(user) {
  if (!user) return 'user';
  if (user.accountType === 'admin' || user.accountType === 'user') return user.accountType;

  const ownsWorkspace = await Organization.exists({ ownerId: user._id });
  const resolved = ownsWorkspace ? 'admin' : 'user';
  user.accountType = resolved;
  await user.save();
  return resolved;
}

module.exports = { resolveAccountType };