const express = require('express');
const rateLimit = require('express-rate-limit');
const { chaosTest, screenshotReview } = require('../controllers/reviewTools.controller');

const router = express.Router();

router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many review tool requests. Wait a few minutes and try again.' },
}));

router.post('/chaos-test', (request, response) => chaosTest(request, response));
router.post('/screenshot', (request, response) => screenshotReview(request, response));

module.exports = router;
