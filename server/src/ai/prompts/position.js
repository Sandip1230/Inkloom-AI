// position.js
module.exports = `Using the discovery context below, define this brand's market position.

Context: {{context}}

Return a JSON object with exactly these keys:
{
  "category": string - the category this brand competes in,
  "valueProposition": string - one clear sentence,
  "differentiator": string - what makes this different from the obvious alternative
}`;