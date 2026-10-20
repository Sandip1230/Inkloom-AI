// visualize.controller.js
const promptTemplate = require('../ai/prompts/visualize');
const { runPromptStage, handleStageError } = require('../ai/runStage');

module.exports = async function visualizeController(request, response, next) {
  const { context = {} } = request.body || {};
  if (!context.shape) {
    return response.status(400).json({ stage: 'visualize', error: 'Run the Shape stage first.' });
  }

  try {
    const result = await runPromptStage('visualize', promptTemplate, { context });
    return response.json(result);
  } catch (error) {
    return handleStageError('visualize', error, response, next);
  }
};