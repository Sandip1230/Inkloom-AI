// understand.controller.js
const promptTemplate = require('../ai/prompts/understand');
const { runPromptStage, handleStageError } = require('../ai/runStage');

module.exports = async function understandController(request, response, next) {
  const { brief } = request.body || {};
  if (!brief || !brief.trim()) {
    return response.status(400).json({ stage: 'understand', error: 'A brief is required.' });
  }

  try {
    const result = await runPromptStage('understand', promptTemplate, { brief: brief.trim() });
    return response.json(result);
  } catch (error) {
    return handleStageError('understand', error, response, next);
  }
};