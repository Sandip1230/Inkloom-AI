const test = require('node:test');
const assert = require('node:assert/strict');
const { parseJsonResponse } = require('../src/controllers/reviewTools.controller');

test('parses plain and fenced JSON returned by the AI provider', () => {
  assert.deepEqual(parseJsonResponse('{"tests":[]}'), { tests: [] });
  assert.deepEqual(parseJsonResponse('```json\n{"tests":[]}\n```'), { tests: [] });
});

test('rejects malformed AI JSON instead of returning an empty success result', () => {
  assert.throws(() => parseJsonResponse('not JSON'), SyntaxError);
});

test('review tools validate input and account deletion requires authentication', async (t) => {
  const envKeys = ['AI_API_KEY', 'OPENROUTER_API_KEY', 'AI_MODEL', 'AI_VISION_MODEL'];
  const savedValues = new Map(envKeys.map((key) => [key, process.env[key]]));
  const originalFetch = global.fetch;
  const request = (...args) => originalFetch(...args);
  envKeys.forEach((key) => { delete process.env[key]; });

  let server;
  try {
    const app = require('../src/app');
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const missingDraft = await request(`${baseUrl}/api/review-tools/chaos-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });
    assert.equal(missingDraft.status, 400);

    const missingImage = await request(`${baseUrl}/api/review-tools/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl: 'data:image/svg+xml;base64,AA==' }),
    });
    assert.equal(missingImage.status, 400);

    const unconfiguredAI = await request(`${baseUrl}/api/review-tools/chaos-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'A draft to review.' }),
    });
    assert.equal(unconfiguredAI.status, 503);
    assert.match((await unconfiguredAI.json()).error, /not configured/);

    process.env.AI_API_KEY = 'test-key';
    process.env.AI_MODEL = 'text-model';
    process.env.AI_VISION_MODEL = 'vision-model';
    const requestedModels = [];
    global.fetch = async (_url, options) => {
      const requestBody = JSON.parse(options.body);
      requestedModels.push(requestBody.model);
      const responseContent = requestBody.model === 'vision-model'
        ? JSON.stringify({
          extractedText: 'A visible headline.',
          findings: [{ type: 'Readability', excerpt: 'A visible headline.', concern: 'Small type may be hard to read.', suggestion: 'Inspect at final size.' }],
        })
        : JSON.stringify({
          tests: [{ riskType: 'Out of context', excerpt: 'draft', scenario: 'A clipped quote could sound absolute.', why: 'The sentence lacks its condition.', reviewQuestion: 'What context will appear beside it?' }],
        });
      return new Response(JSON.stringify({ choices: [{ message: { content: responseContent } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const chaosResult = await request(`${baseUrl}/api/review-tools/chaos-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'A draft to review.' }),
    });
    assert.equal(chaosResult.status, 200);
    const chaosBody = await chaosResult.json();
    assert.equal(chaosBody.isApproval, false, JSON.stringify(chaosBody));

    const screenshotResult = await request(`${baseUrl}/api/review-tools/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl: 'data:image/png;base64,AA==' }),
    });
    assert.equal(screenshotResult.status, 200);
    assert.equal((await screenshotResult.json()).extractedText, 'A visible headline.');
    assert.deepEqual(requestedModels, ['text-model', 'vision-model']);

    const unauthenticatedDelete = await request(`${baseUrl}/api/auth/account`, { method: 'DELETE' });
    assert.equal(unauthenticatedDelete.status, 401);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of savedValues) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
