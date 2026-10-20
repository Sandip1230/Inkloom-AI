// understand.js
module.exports = `Analyze the business idea below.

Idea: {{brief}}

Return a JSON object with exactly these keys:
{
  "problem": string - the real problem being solved,
  "audience": string - who this is really for,
  "constraints": string[] - practical constraints or limits,
  "openQuestions": string[] - questions worth clarifying before branding starts
}`;