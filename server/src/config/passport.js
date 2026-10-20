const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

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

        // 1. Try to find by googleId first (returning user via Google)
        let user = await User.findOne({ googleId: profile.id });

        // 2. If not found, but an account with this email already exists
        //    (e.g. signed up with password, or via GitHub), link Google to it
        //    instead of creating a duplicate.
        if (!user && email) {
          user = await User.findOne({ email });
          if (user && !user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
            await user.save();
          }
        }

        // 3. Still no user found anywhere -> create a brand new one
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

        // 1. Try to find by githubId first (returning user via GitHub)
        let user = await User.findOne({ githubId: profile.id });

        // 2. If not found, but an account with this email already exists
        //    (e.g. signed up with password, or via Google), link GitHub to it
        //    instead of creating a duplicate.
        if (!user && email) {
          user = await User.findOne({ email });
          if (user && !user.githubId) {
            user.githubId = profile.id;
            if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
            await user.save();
          }
        }

        // 3. Still no user found anywhere -> create a brand new one
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

module.exports = passport;
module.exports.CLIENT_ORIGIN = CLIENT_ORIGIN;