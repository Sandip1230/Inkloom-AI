const test = require('node:test');
const assert = require('node:assert/strict');
const { retrieveEvidence, chunkDocument } = require('../src/claimReview/retrieval');
const { analyzeClaim } = require('../src/claimReview/analysis');

const DOC = {
  documentId: 'doc1',
  title: 'Security Whitepaper',
  owner: 'Security Team',
  version: 2,
  contentHash: 'abc',
  content: [
    '# Data protection',
    '',
    'Passwords are hashed before being stored in the database.',
    '',
    '## Availability',
    '',
    'The service targets 99.9% uptime measured monthly.',
    '',
    'Support is available on weekdays from 9am to 5pm.',
  ].join('\n'),
};

test('chunkDocument records section, paragraph, line and offsets', () => {
  const passages = chunkDocument(DOC.content);
  assert.equal(passages.length, 3);
  assert.equal(passages[0].section, 'Data protection');
  assert.equal(passages[0].paragraph, 1);
  assert.equal(passages[0].line, 3);
  assert.equal(DOC.content.slice(passages[0].startOffset, passages[0].endOffset), passages[0].text);
});

test('retrieval returns verbatim excerpts with document and version', () => {
  const hits = retrieveEvidence('The system stores user passwords in plain text.', [DOC]);
  assert.ok(hits.length >= 1);
  assert.match(hits[0].excerpt, /Passwords are hashed/);
  assert.equal(hits[0].documentTitle, 'Security Whitepaper');
  assert.equal(hits[0].version, 2);
  assert.ok(DOC.content.includes(hits[0].excerpt));
});

test('retrieval returns nothing when no approved document is relevant', () => {
  assert.deepEqual(retrieveEvidence('Our mascot is a purple elephant.', [DOC]), []);
  assert.deepEqual(retrieveEvidence('anything at all', []), []);
});

test('no evidence is Unverified and the AI is never called', async () => {
  let called = false;
  const result = await analyzeClaim({ claim: 'x', evidence: [], complete: async () => { called = true; return ''; } });
  assert.equal(result.status, 'Unverified');
  assert.equal(result.method, 'none');
  assert.match(result.rationale, /does not mean the claim is false/);
  assert.equal(called, false);
});

const evidence = [{ documentTitle: 'Security Whitepaper', version: 2, excerpt: 'Passwords are hashed before being stored in the database.' }];

test('accepts a Contradicted suggestion only with a verbatim quote', async () => {
  const good = await analyzeClaim({
    claim: 'The system stores user passwords in plain text.',
    evidence,
    complete: async () => JSON.stringify({ status: 'Contradicted', rationale: 'E1 says they are hashed.', evidence: [{ id: 'E1', relation: 'contradicts', quote: 'Passwords are hashed before being stored' }] }),
  });
  assert.equal(good.status, 'Contradicted');
  assert.equal(good.relations[0].relation, 'contradicts');

  const invented = await analyzeClaim({
    claim: 'The system stores user passwords in plain text.',
    evidence,
    complete: async () => JSON.stringify({ status: 'Contradicted', rationale: 'Made up.', evidence: [{ id: 'E1', relation: 'contradicts', quote: 'Passwords are never stored anywhere' }] }),
  });
  assert.equal(invented.status, 'Unverified');
});

test('Supported without a cited excerpt is downgraded; conflicting sources become Unverified', async () => {
  const noCitation = await analyzeClaim({
    claim: 'c', evidence,
    complete: async () => JSON.stringify({ status: 'Supported', rationale: 'Trust me.', evidence: [] }),
  });
  assert.equal(noCitation.status, 'Unverified');

  const two = [...evidence, { documentTitle: 'Other', version: 1, excerpt: 'Passwords are stored in plain text for legacy accounts.' }];
  const conflict = await analyzeClaim({
    claim: 'c', evidence: two,
    complete: async () => JSON.stringify({ status: 'Supported', rationale: 'Mixed.', evidence: [
      { id: 'E1', relation: 'contradicts', quote: 'Passwords are hashed before' },
      { id: 'E2', relation: 'supports', quote: 'stored in plain text for legacy' },
    ] }),
  });
  assert.equal(conflict.status, 'Unverified');
  assert.match(conflict.rationale, /conflict/);
});

test('AI failure or garbage output falls back to Unverified instead of throwing', async () => {
  const failed = await analyzeClaim({ claim: 'c', evidence, complete: async () => { throw new Error('boom'); } });
  assert.equal(failed.status, 'Unverified');
  assert.equal(failed.method, 'unavailable');
  const garbage = await analyzeClaim({ claim: 'c', evidence, complete: async () => 'not json' });
  assert.equal(garbage.method, 'unavailable');
  const notConfigured = await analyzeClaim({ claim: 'c', evidence });
  assert.equal(notConfigured.method, 'unavailable');
});

test('claim-review API requires authentication', async (t) => {
  const app = require('../src/app');
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/claim-review/workspaces/507f1f77bcf86cd799439011/documents`);
  assert.equal(response.status, 401);
});