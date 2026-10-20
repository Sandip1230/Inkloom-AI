// deliver.controller.js
const promptTemplate = require('../ai/prompts/deliver');
const { runPromptStage, handleStageError } = require('../ai/runStage');

module.exports = async function deliverController(request, response, next) {
  const { context = {} } = request.body || {};
  if (!context.challenge) {
    return response.status(400).json({ stage: 'deliver', error: 'Run the Challenge stage first.' });
  }

  try {
    const result = await runPromptStage('deliver', promptTemplate, { context });
    return response.json(result);
  } catch (error) {
    return handleStageError('deliver', error, response, next);
  }
};