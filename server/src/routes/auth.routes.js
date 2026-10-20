// auth.routes.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');

const router = express.Router();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

function issueTokenAndRedirect(request, response) {
  const token = jwt.sign(
    { id: request.user._id, name: request.user.name, email: request.user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  response.redirect(`${CLIENT_ORIGIN}/auth/callback?token=${token}`);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Wait a few minutes and try again.' },
});

// --- Email/password ---
router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/verify-reset-code', authLimiter, authController.verifyResetCode);
router.post('/reset-password', authLimiter, authController.resetPassword);

// --- Google ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_ORIGIN}/login` }),
  issueTokenAndRedirect
);

// --- GitHub ---
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${CLIENT_ORIGIN}/login` }),
  issueTokenAndRedirect
);

module.exports = router;