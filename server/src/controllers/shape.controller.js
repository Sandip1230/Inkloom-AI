// shape.controller.js
const promptTemplate = require('../ai/prompts/shape');
const { runPromptStage, handleStageError } = require('../ai/runStage');

module.exports = async function shapeController(request, response, next) {
  const { context = {} } = request.body || {};
  if (!context.position) {
    return response.status(400).json({ stage: 'shape', error: 'Run the Position stage first.' });
  }

  try {
    const result = await runPromptStage('shape', promptTemplate, { context });
    return response.json(result);
  } catch (error) {
    return handleStageError('shape', error, response, next);
  }
};