const express = require('express');
const rateLimit = require('express-rate-limit');
const BrandSession = require('../models/BrandSession');

const controllers = {
  understand: require('../controllers/understand.controller'),
  position: require('../controllers/position.controller'),
  shape: require('../controllers/shape.controller'),
  visualize: require('../controllers/visualize.controller'),
  challenge: require('../controllers/challenge.controller'),
  deliver: require('../controllers/deliver.controller'),
};

const router = express.Router();

// Throttle AI calls so one bad actor (or a stuck retry loop) can't
// burn through the OpenRouter quota during the demo/judging window.
const stageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests from this client. Wait a few minutes and try again.' },
});

router.use(stageLimiter);

// Stateless — exactly what the frontend currently calls. Unchanged.
router.post('/:stageName', (request, response, next) => {
  const controller = controllers[request.params.stageName];
  if (!controller) return response.status(404).json({ error: 'Unknown pipeline stage' });
  return controller(request, response, next);
});

// Optional persisted variant: runs the stage AND saves the result onto
// a BrandSession, so a session can be resumed later or inspected via
// GET /api/brand/:id. Frontend can switch to this later if needed;
// nothing existing breaks if it's never called.
router.post('/:stageName/session/:id', async (request, response, next) => {
  const { stageName, id } = request.params;
  const controller = controllers[stageName];
  if (!controller) return response.status(404).json({ error: 'Unknown pipeline stage' });

  try {
    const session = await BrandSession.findById(id);
    if (!session) return response.status(404).json({ error: 'Brand session not found' });

    // Reuse the existing controller logic by capturing its response
    // instead of duplicating the AI-call logic here.
    const fakeResponse = {
      _status: 200,
      status(code) { this._status = code; return this; },
      json(payload) { this._payload = payload; return this; },
    };

    await controller(request, fakeResponse, next);
    if (fakeResponse._status >= 400) {
      return response.status(fakeResponse._status).json(fakeResponse._payload);
    }

    session.stages.set(stageName, fakeResponse._payload);
    await session.save();

    return response.json({ session, result: fakeResponse._payload });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;