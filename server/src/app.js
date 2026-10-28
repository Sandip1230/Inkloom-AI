const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('./config/passport');
const brandRoutes = require('./routes/brand.routes');
const stageRoutes = require('./routes/stages.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const reviewToolsRoutes = require('./routes/review-tools.routes');
const claimReviewRoutes = require('./routes/claim-review.routes');
const errorHandler = require('./middleware/errorHandler');
const workspaceReviewsRoutes = require('./routes/workspace-reviews.routes');
const app = express();

// @ts-ignore - helmet typings warning only, works at runtime
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '3mb' }));
app.use(passport.initialize());

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/stages', stageRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/review-tools', reviewToolsRoutes);
<<<<<<< HEAD
app.use('/api/workspaces/:workspaceId/reviews', workspaceReviewsRoutes);
=======
app.use('/api/claim-review', claimReviewRoutes);
>>>>>>> 75066ee35106e0b1c34fe64b8897f20375abf493

app.use((request, response) => response.status(404).json({ error: `No route: ${request.method} ${request.originalUrl}` }));
app.use(errorHandler);

module.exports = app;