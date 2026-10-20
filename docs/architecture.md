# Architecture

Brandloom is organized as a Vite/React client and an Express API. The client owns the staged workflow UI and calls the API through `client/src/api/brandApi.js`. The server validates and orchestrates stage requests, calls the AI client, and persists a brand session and its outputs in MongoDB.

## Pipeline

1. **Understand** extracts the problem, audience, constraints, and open questions.
2. **Position** develops the category, differentiator, and value proposition.
3. **Shape** defines personality, naming directions, voice, and tagline.
4. **Visualize** proposes typography, color mood, and imagery direction.
5. **Challenge** identifies generic patterns and suggests alternatives.
6. **Deliver** assembles the final brand name, launch copy, and an exportable brand kit, applying the Challenge stage's findings.

Each stage consumes the brief and relevant prior outputs. Every controller rejects a request that is missing its required prior stage (e.g. Position requires an `understand` result in `context`) before calling the AI client at all.

## AI call + validation flow

`server/src/ai/runStage.js` is the shared pipeline every stage controller calls through:

1. Fill the stage's prompt template (`server/src/ai/prompts`) with the brief/context.
2. Call the AI client (`server/src/ai/client.js`, Groq — OpenAI-compatible chat completions API) with the shared system prompt.
3. Extract a JSON object from the raw response (tolerates stray markdown fences).
4. Validate the parsed object against that stage's schema (`server/src/ai/schemas`).
5. If parsing or validation fails, retry once with the specific error appended to the prompt.
6. If it still fails, the controller returns `502` with a generic "unusable response" message; a missing API key returns `500`.

## Local development

Install dependencies with `npm install` in the root, `client`, and `server` directories. Configure `server/.env` from `.env.example` (needs `AI_API_KEY`, `AI_BASE_URL`, optional `MONGO_URI`), then run `npm run dev` in the root to start both applications. The client uses port `5173`; the API uses port `3001`.