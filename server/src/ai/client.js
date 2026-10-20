// Provider-agnostic: works with any OpenAI-compatible chat/completions endpoint
// (OpenRouter, Groq, etc). Set AI_BASE_URL / AI_API_KEY / AI_MODEL in .env to
// switch providers with zero code changes. Falls back to the old
// OPENROUTER_* var names so existing .env files keep working unchanged.
const AI_URL = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';

function createAIClient() {
  const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY;
  // Switched off the free-tier reasoning model - it queues for 30-55s+ on
  // OpenRouter's shared free pool, which was the root cause of the
  // "server took too long" / "can't reach server" errors. A fast instruct
  // model answers in a few seconds and doesn't need the reasoning workaround.
  const model = process.env.AI_MODEL || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';

  if (!apiKey) throw new Error('AI_API_KEY (or OPENROUTER_API_KEY) is required for AI stages');

  async function complete({ system, prompt, maxTokens = 3000 }) {
    const controller = new AbortController();
    // Fast model - 20s is generous now. Still comfortably below the
    // client's 60s axios timeout so the server always gets to respond.
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      response = await fetch(AI_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_ORIGIN || 'http://localhost:5173',
          'X-Title': 'Brandloom',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt },
          ],
        }),
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI provider request timed out after 20s. Try again, or check your AI_MODEL / API key.');
      }
      throw new Error(`Could not reach AI provider (${AI_URL}): ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[ai/client] Provider ${response.status} for model "${model}":`, errorBody);
      throw new Error(`AI provider request failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    const reasoning = choice?.message?.reasoning;

    if (choice?.finish_reason === 'length') {
      console.warn(`[ai/client] Response was cut off by max_tokens (finish_reason: length). Consider raising maxTokens.`);
    }

    if (content && content.trim()) {
      return content;
    }

    if (reasoning && reasoning.trim()) {
      console.warn('[ai/client] message.content was empty - falling back to message.reasoning.');
      return reasoning;
    }

    console.error('[ai/client] Provider returned no usable content:', JSON.stringify(data).slice(0, 1000));
    return '';
  }

  return { complete };
}

module.exports = { createAIClient };