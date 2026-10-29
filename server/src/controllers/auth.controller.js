// auth.controller.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditEvent = require('../models/AuditEvent');
const GovernanceSource = require('../models/GovernanceSource');
const SharedReview = require('../models/SharedReview');
const PersonalReview = require('../models/PersonalReview');
const Organization = require('../models/Organization');
const WorkspaceMembership = require('../models/WorkspaceMembership');
const { sendEmail } = require('../utils/sendEmail');
const { resolveAccountType } = require('../utils/accountType');

// Company Admin registration is protected by ADMIN_SIGNUP_CODE (set it in server/.env).
// If it is not set, admin sign-up is open outside production and closed in production.
function checkAdminInvite(code) {
  const expected = process.env.ADMIN_SIGNUP_CODE;
  if (!expected) {
    return process.env.NODE_ENV === 'production'
      ? 'Company Admin registration is disabled. Ask the site owner to configure an admin invite code.'
      : null;
  }
  const a = Buffer.from(String(code || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return 'That Company Admin invite code is not valid.';
  }
  return null;
}

const RESET_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SALT_ROUNDS = 10;

function issueAuthToken(user, accountType = user.accountType || 'user') {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, accountType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

function publicUser(user, accountType = user.accountType || 'user') {
  return { id: user._id, name: user.name, email: user.email, avatar: user.avatar || null, accountType };
}

async function signup(request, response, next) {
  try {
    const { name, email, password, accountType: requestedType, adminCode } = request.body || {};
    if (!name || !email || !password) {
      return response.status(400).json({ error: 'Name, email and password are all required.' });
    }
    if (password.length < 8) {
      return response.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return response.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const accountType = requestedType === 'admin' ? 'admin' : 'user';
    if (accountType === 'admin') {
      const inviteError = checkAdminInvite(adminCode);
      if (inviteError) return response.status(403).json({ error: inviteError });
    }
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, accountType });

    return response.status(201).json({ token: issueAuthToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function login(request, response, next) {
  try {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return response.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.passwordHash) {
      return response.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return response.status(401).json({ error: 'Invalid email or password.' });
    }

    const accountType = await resolveAccountType(user);
    return response.json({ token: issueAuthToken(user, accountType), user: publicUser(user, accountType) });
  } catch (error) {
    return next(error);
  }
}

// Lets the client confirm the authoritative account type (e.g. for tokens issued before account types existed).
async function me(request, response, next) {
  try {
    const user = await User.findById(request.userId);
    if (!user) return response.status(404).json({ error: 'This account no longer exists.' });
    const accountType = await resolveAccountType(user);
    return response.json({ user: publicUser(user, accountType) });
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(request, response, next) {
  try {
    const { email } = request.body || {};
    if (!email) {
      return response.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    const genericResponse = { message: `If an account exists for ${email}, a reset code has been sent.` };

    if (user) {
      const code = crypto.randomInt(100000, 999999).toString();
      user.resetCodeHash = await bcrypt.hash(code, SALT_ROUNDS);
      user.resetCodeExpires = new Date(Date.now() + RESET_CODE_TTL_MS);
      await user.save();

      await sendEmail({
        to: user.email,
        subject: 'Your Inkloom AI password reset code',
        text: `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      });
    }

    return response.json(genericResponse);
  } catch (error) {
    return next(error);
  }
}

async function verifyResetCode(request, response, next) {
  try {
    const { email, code } = request.body || {};
    if (!email || !code) {
      return response.status(400).json({ error: 'Email and code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    const invalidResponse = () => response.status(400).json({ error: 'That code is invalid or has expired.' });

    if (!user || !user.resetCodeHash || !user.resetCodeExpires) return invalidResponse();
    if (user.resetCodeExpires.getTime() < Date.now()) return invalidResponse();

    const codeMatches = await bcrypt.compare(code, user.resetCodeHash);
    if (!codeMatches) return invalidResponse();

    user.resetCodeHash = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    const resetToken = jwt.sign({ id: user._id, purpose: 'password-reset' }, process.env.JWT_SECRET, {
      expiresIn: '10m',
    });

    return response.json({ resetToken });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(request, response, next) {
  try {
    const { resetToken, newPassword } = request.body || {};
    if (!resetToken || !newPassword) {
      return response.status(400).json({ error: 'Reset token and new password are required.' });
    }
    if (newPassword.length < 8) {
      return response.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return response.status(400).json({ error: 'This reset link has expired. Start over from "Forgot password".' });
    }

    if (payload.purpose !== 'password-reset') {
      return response.status(400).json({ error: 'Invalid reset token.' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return response.status(404).json({ error: 'Account no longer exists.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return response.json({ message: 'Password updated. You can now sign in with your new password.' });
  } catch (error) {
    return next(error);
  }
}

async function deleteAccount(request, response, next) {
  try {
    const user = await User.findById(request.userId).select('_id');
    if (!user) return response.status(404).json({ error: 'This account no longer exists.' });

    const ownedWorkspace = await Organization.exists({ ownerId: user._id });
    if (ownedWorkspace) {
      return response.status(409).json({
        error: 'Account deletion is unavailable while you own a workspace. No shared workspace data was changed.',
      });
    }

    await Promise.all([
      WorkspaceMembership.deleteMany({ userId: user._id }),
      PersonalReview.deleteMany({ userId: user._id }),
      AuditEvent.updateMany({ actorId: user._id }, { $set: { actorId: null } }),
      GovernanceSource.updateMany(
        { $or: [{ createdBy: user._id }, { 'versions.editedBy': user._id }] },
        { $set: { createdBy: null, 'versions.$[].editedBy': null } },
      ),
      SharedReview.updateMany(
        { createdBy: user._id },
        { $set: { createdBy: null, createdByName: 'Former member' } },
      ),
      SharedReview.updateMany(
        {
          $or: [
            { 'comments.authorId': user._id },
            { 'decisions.actorId': user._id },
            { 'assignees.userId': user._id },
          ],
        },
        {
          $set: {
            'comments.$[c].authorId': null,
            'comments.$[c].authorName': 'Former member',
            'decisions.$[d].actorId': null,
            'decisions.$[d].actorName': 'Former member',
          },
          $pull: { assignees: { userId: user._id } },
        },
        { arrayFilters: [{ 'c.authorId': user._id }, { 'd.actorId': user._id }] },
      ),
    ]);
    await User.deleteOne({ _id: user._id });

    return response.json({ message: 'Account and personal profile data deleted.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { signup, login, me, forgotPassword, verifyResetCode, resetPassword, deleteAccount };