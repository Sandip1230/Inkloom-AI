const express = require('express');
const BrandSession = require('../models/BrandSession');

const router = express.Router();

router.post('/', async (request, response, next) => {
  try {
    const { brief } = request.body;
    if (!brief || typeof brief !== 'string' || brief.trim().length < 5) {
      return response.status(400).json({ error: "Provide a 'brief' string of at least 5 characters." });
    }
    const brand = await BrandSession.create({ brief: brief.trim() });
    return response.status(201).json(brand);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  try {
    const brand = await BrandSession.findById(request.params.id);
    if (!brand) return response.status(404).json({ error: 'Brand session not found' });
    return response.json(brand);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (request, response, next) => {
  try {
    const brand = await BrandSession.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true,
    });
    if (!brand) return response.status(404).json({ error: 'Brand session not found' });
    return response.json(brand);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;