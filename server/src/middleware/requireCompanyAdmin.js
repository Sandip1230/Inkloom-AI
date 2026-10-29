const User = require('../models/User');
const { resolveAccountType } = require('../utils/accountType');

const ADMIN_ONLY_MESSAGE =
  'Company Admin workspace is only accessible to Company Admins. Sign in with an account that was registered as an Admin.';

// Must run after requireAuth. Reads the account type from the database (not the JWT),
// so it cannot be bypassed with an old or edited token.
async function requireCompanyAdmin(request, response, next) {
  try {
    const user = await User.findById(request.userId).select('accountType');
    if (!user) return response.status(401).json({ error: 'This account no longer exists.' });
    if ((await resolveAccountType(user)) !== 'admin') {
      return response.status(403).json({ error: ADMIN_ONLY_MESSAGE, code: 'ADMIN_ONLY' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = requireCompanyAdmin;