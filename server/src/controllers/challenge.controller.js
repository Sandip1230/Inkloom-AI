// challenge.controller.js
const generatorPrompt = require('../ai/prompts/challengeGenerator');
const criticPrompt = require('../ai/prompts/challenge');
const { runPromptStage, handleStageError } = require('../ai/runStage');

module.exports = async function challengeController(request, response, next) {
  const { context = {} } = request.body || {};
  if (!context.visualize) {
    return response.status(400).json({ stage: 'challenge', error: 'Run the Visualize stage first.' });
  }

  try {
    // Round 1 - Generator agent: cast a wide net, over-report rather than
    // under-report possible issues.
    const draft = await runPromptStage('challengeDraft', generatorPrompt, { context });

    // Round 2 - Critic agent: pressure-tests every draft finding against the
    // same context, drops what doesn't actually hold up, and produces the
    // score the client shows. This is the debate loop - two independent
    // reasoning passes instead of one pass reporting on itself.
    const final = await runPromptStage('challenge', criticPrompt, {
      context,
      draftFindings: draft.findings,
    });

    return response.json({ ...final, draftFindingsCount: draft.findings.length });
  } catch (error) {
    return handleStageError('challenge', error, response, next);
  }
};