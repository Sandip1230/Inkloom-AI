// position.controller.js
const promptTemplate = require('../ai/prompts/position');
const { runPromptStage, handleStageError } = require('../ai/runStage');

module.exports = async function positionController(request, response, next) {
  const { context = {} } = request.body || {};
  if (!context.understand) {
    return response.status(400).json({ stage: 'position', error: 'Run the Understand stage first.' });
  }

  try {
    const result = await runPromptStage('position', promptTemplate, { context });
    return response.json(result);
  } catch (error) {
    return handleStageError('position', error, response, next);
  }
};