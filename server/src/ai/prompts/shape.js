// shape.js
module.exports = `Using the brand context below, shape this brand's personality and voice.

Context: {{context}}

Return a JSON object with exactly these keys:
{
  "traits": string[] - 3 to 5 personality traits, each justified against the specific audience (not generic branding traits),
  "traitsToAvoid": string[] - traits that would be wrong for this audience,
  "namingDirections": string[] - 3 naming directions, each with a short rationale,
  "voice": string - how the brand should sound when it writes,
  "tagline": string - one memorable line
}`;