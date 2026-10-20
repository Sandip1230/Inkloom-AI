const { createAIClient } = require('./client');
const SYSTEM_PROMPT = require('./systemPrompt');
const SCHEMAS = require('./schemas');
const { validateAgainstSchema } = require('./schemas/validate');

function fillTemplate(template, vars) {
      return template.replace(/{{\s*(\w+)\s*}}/g, (_match, key) => {
            const value = vars[key];
            if (value === undefined) return '';
            return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      });
}

function extractJson(text) {
      const trimmed = (text || '').trim();
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const candidate = fenced ? fenced[1] : trimmed;
      const start = candidate.indexOf('{');
      const end = candidate.lastIndexOf('}');
      if (start === -1 || end === -1 || end < start) {
            throw new Error('AI response did not contain a JSON object');
      }
      return JSON.parse(candidate.slice(start, end + 1));
}

// Pulls the HTTP status out of client.js's "AI provider request failed (429): ..."
// style error messages, so we can tell a transient provider hiccup (rate limit,
// momentary 5xx) apart from something retrying won't fix (bad auth, 400, etc).
function providerStatus(error) {
      const match = error.message?.match(/AI provider request failed \((\d+)\)/);
      return match ? Number(match[1]) : null;
}

function isTransientProviderError(error) {
      const status = providerStatus(error);
      if (status === 429 || (status !== null && status >= 500)) return true;
      return error.message?.includes('AI provider request timed out') || false;
}

// Groq (and most OpenAI-compatible providers) put the required cool-down
// directly in the 429 body, e.g. "Please try again in 24.66s". Waiting a
// fixed 1.2s and retrying into the same rate limit just burns the retry, so
// we parse the provider's own number and wait that long instead (capped so
// we don't hang forever on a huge quota reset).
function providerRetryDelayMs(error) {
      const match = error.message?.match(/try again in\s+([\d.]+)\s*s/i);
      if (!match) return null;
      const seconds = Number(match[1]);
      if (!Number.isFinite(seconds) || seconds <= 0) return null;
      // Small buffer on top of the provider's own estimate, capped at 15s so a
      // single retry (each side capped at 20s in client.js) never stalls the
      // whole request past the frontend's own ~60s timeout.
      return Math.min(Math.ceil(seconds * 1000) + 300, 15000);
}

function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPromptStage(stageName, promptTemplate, vars, { retries = 1 } = {}) {
      const client = createAIClient();
      const prompt = fillTemplate(promptTemplate, vars);
      const schema = SCHEMAS[stageName];

      let lastError;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
            const isRetry = attempt > 0;
            const attemptPrompt = isRetry && !isTransientProviderError(lastError)
                  ? `${prompt}\n\nYour previous reply could not be used: ${lastError.message}\nRespond again with ONLY one valid JSON object matching the schema above - no markdown fences, no commentary, no text before or after it, and make sure every required field is present with the correct type.`
                  : prompt;

            try {
                  const raw = await client.complete({ system: SYSTEM_PROMPT, prompt: attemptPrompt, maxTokens: 3000 });
                  const parsed = extractJson(raw);

                  if (schema) {
                        const errors = validateAgainstSchema(stageName, schema, parsed);
                        if (errors.length > 0) {
                              throw new Error(`Schema validation failed for stage "${stageName}": ${errors.join(' ')}`);
                        }
                  }

                  return parsed;
            } catch (error) {
                  lastError = error;
                  const isRecoverable =
                        error.message?.includes('did not contain a JSON object') ||
                        error.message?.includes('Schema validation failed') ||
                        isTransientProviderError(error) ||
                        error instanceof SyntaxError;
                  if (!isRecoverable || attempt === retries) throw error;

                  console.warn(`[runStage] "${stageName}" attempt ${attempt + 1} failed, retrying:`, error.message);
                  // Rate limits and momentary 5xx need a beat before retrying -
                  // hammering immediately just gets rate-limited again. Prefer
                  // the provider's own "try again in Xs" figure when it gives
                  // one (Groq always does for 429s); fall back to a flat 1.2s
                  // for other transient errors (timeouts, 5xx without a hint).
                  if (isTransientProviderError(error)) {
                        const delay = providerRetryDelayMs(error) ?? 1200;
                        await sleep(delay);
                  }
            }
      }
      throw lastError;
}

function handleStageError(stageName, error, response, next) {
      console.error(`[stage: ${stageName}] failed:`, error.message);

      if (error.message?.includes('AI_API_KEY') || error.message?.includes('OPENROUTER_API_KEY')) {
            return response.status(500).json({ stage: stageName, error: 'Server is missing an AI provider API key.' });
      }
      if (
            error.message?.startsWith('AI provider request failed') ||
            error.message?.includes('AI provider request timed out') ||
            error.message?.includes('Could not reach AI provider') ||
            error.message?.startsWith('OpenRouter request failed') ||
            error.message?.includes('OpenRouter request timed out') ||
            error.message?.includes('Could not reach OpenRouter') ||
            error.message?.includes('did not contain a JSON object') ||
            error.message?.includes('Schema validation failed') ||
            error instanceof SyntaxError
      ) {
            return response.status(502).json({ stage: stageName, error: 'The AI service returned an unusable response. Try again.' });
      }
      return next(error);
}

module.exports = { runPromptStage, fillTemplate, extractJson, handleStageError };