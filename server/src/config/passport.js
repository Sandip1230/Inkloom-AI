const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          let user = await User.findOne({ googleId: profile.id });

          if (!user && email) {
            user = await User.findOne({ email });
            if (user && !user.googleId) {
              user.googleId = profile.id;
              if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
              await user.save();
            }
          }

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName || 'Google User',
              email,
              avatar: profile.photos?.[0]?.value,
            });
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      },
    ),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.GITHUB_CALLBACK_URL) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          let user = await User.findOne({ githubId: profile.id });

          if (!user && email) {
            user = await User.findOne({ email });
            if (user && !user.githubId) {
              user.githubId = profile.id;
              if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
              await user.save();
            }
          }

          if (!user) {
            user = await User.create({
              githubId: profile.id,
              name: profile.displayName || profile.username || 'GitHub User',
              email,
              avatar: profile.photos?.[0]?.value,
            });
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      },
    ),
  );
}

module.exports = passport;
module.exports.CLIENT_ORIGIN = CLIENT_ORIGIN;