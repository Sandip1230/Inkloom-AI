const test = require('node:test');
const assert = require('node:assert/strict');
const { createAIClient } = require('../src/ai/client');

test('uses the configured vision model and multimodal message for an image request', async (t) => {
  const envKeys = ['AI_API_KEY', 'AI_MODEL', 'AI_VISION_MODEL'];
  const savedValues = new Map(envKeys.map((key) => [key, process.env[key]]));
  const originalFetch = global.fetch;
  const requests = [];
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_MODEL = 'text-model';
  process.env.AI_VISION_MODEL = 'vision-model';
  global.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  t.after(() => {
    global.fetch = originalFetch;
    for (const [key, value] of savedValues) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const { complete } = createAIClient();
  const textResult = await complete({
    system: 'Review text.',
    prompt: 'This is a text request.',
  });
  assert.equal(textResult, 'ok');
  const result = await complete({
    system: 'Review an image.',
    prompt: 'Inspect this screenshot.',
    imageDataUrl: 'data:image/png;base64,AA==',
  });

  assert.equal(result, 'ok');
  assert.equal(requests[0].model, 'text-model');
  assert.equal(requests[0].messages[1].content, 'This is a text request.');
  assert.equal(requests[1].model, 'vision-model');
  assert.deepEqual(requests[1].messages[1].content, [
    { type: 'text', text: 'Inspect this screenshot.' },
    { type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } },
  ]);
});
