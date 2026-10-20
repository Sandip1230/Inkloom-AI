// challenge.js — schema for the Challenge stage's final (critic) response
module.exports = {
  findings: 'object[]', // each: { issue, before, after, rationale, verdict }
  score: 'number',       // 0-100 brand consistency/strength score
  consistent: 'boolean',
  verdict: 'string',     // one/two sentence summary of what the debate concluded
};