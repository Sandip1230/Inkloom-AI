# Prompt design

Prompts live in `server/src/ai/prompts` as stage-specific templates. Each keeps its reasoning step narrow, carries forward only the accumulated brand context needed by that stage, and requires structured JSON output. Every stage's response schema lives in `server/src/ai/schemas` and is enforced by `runStage.js` before a result is returned or persisted — an invalid response triggers one automatic retry with the specific validation errors appended to the prompt.

## Contracts

These match the schema files exactly:

- **Understand:** `problem` (string), `audience` (string), `constraints` (string[]), `openQuestions` (string[])
- **Position:** `category` (string), `valueProposition` (string), `differentiator` (string)
- **Shape:** `traits` (string[]), `traitsToAvoid` (string[]), `namingDirections` (string[]), `voice` (string), `tagline` (string)
- **Visualize:** `typography` (string), `colorMood` (string), `imageryStyle` (string), `conceptsToAvoid` (string[])
- **Challenge:** `findings` (object[] — `issue`, `before`, `after`, `rationale`), `consistent` (boolean)
- **Deliver:** `brandName` (string), `summary` (string), `position` (object), `personality` (object), `visual` (object), `launch` (object — `landingHeadline`, `onelinePitch`, `socialLaunchPost`), `openGaps` (string[])

Prompts must distinguish user-provided facts from generated proposals, avoid inventing evidence, and retain uncertainty rather than presenting assumptions as facts.