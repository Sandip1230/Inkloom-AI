const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('./config/passport');
const brandRoutes = require('./routes/brand.routes');
const stageRoutes = require('./routes/stages.routes');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(passport.initialize());

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/stages', stageRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/auth', authRoutes);

app.use((request, response) => response.status(404).json({ error: `No route: ${request.method} ${request.originalUrl}` }));
app.use(errorHandler);

module.exports = app;