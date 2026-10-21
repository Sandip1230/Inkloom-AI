const test = require('node:test');
const assert = require('node:assert/strict');

test('API starts without OAuth credentials and protects admin routes', async (t) => {
  const oauthKeys = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_CALLBACK_URL',
  ];
  const savedValues = new Map(oauthKeys.map((key) => [key, process.env[key]]));
  oauthKeys.forEach((key) => { delete process.env[key]; });

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
    const adminResponse = await fetch(`${baseUrl}/api/admin/workspaces`);
    assert.equal(adminResponse.status, 401);
    assert.equal((await adminResponse.json()).error, 'Sign in to access workspace administration.');

    const googleResponse = await fetch(`${baseUrl}/api/auth/google`);
    assert.equal(googleResponse.status, 503);
    assert.equal((await googleResponse.json()).error, 'Google sign-in is not configured.');
  } finally {
    for (const [key, value] of savedValues) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
