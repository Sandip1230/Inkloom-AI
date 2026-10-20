# Inkloom architecture

Inkloom's current brand-governance prototype is a Vite/React client. Its review workspace runs deterministic text checks in the browser and stores draft reviews and terminology rules in `localStorage`. Review text is not sent to the API by the current workspace.

## Review workflow

1. A creator pastes a draft and selects its content type.
2. The local review engine checks absolute promotional claims, configured preferred terminology, descriptive link text, long sentences and repeated all-caps wording.
3. Each finding shows the reason, check that produced it and a suggested next step. Terminology and claim suggestions can be applied one at a time.
4. A human can save the draft as awaiting approval, request changes, or approve it, with an optional name and note.
5. The review history and insights pages summarize the items stored in that browser.

Terminology rules and review records are persisted under Inkloom-specific local-storage keys. Legacy authentication and theme keys are read where needed to avoid invalidating existing browser sessions and preferences. No role-based permissions or shared team storage are implemented yet.

## Current review checks and limits

The analyzer lives in `client/src/lib/governance.js`; persistence helpers live in `client/src/lib/reviewStore.js`. It uses explicit string and pattern checks, not an AI model. Its results are signals for a reviewer, not a verification of truth, legal compliance, or accessibility conformance. Only text is reviewed. Approved facts and source documents, images and assets, collaboration across devices, and centralized governance analytics are not connected.

## Existing API

The Express server retains the earlier staged brand-creation API and authentication routes. Stage requests use `client/src/api/brandApi.js`, are orchestrated by `server/src/ai/runStage.js`, validated against the schemas in `server/src/ai/schemas`, and can persist brand-session results in MongoDB. The current governance workspace does not call those stage endpoints. They should not be interpreted as the governance analyzer or as approved-source verification.

## Local development

Install dependencies in the root, `client`, and `server` directories, then start the frontend and backend together from the root:

```sh
npm install
npm install --prefix client
npm install --prefix server
npm run dev
```

The client runs on port `5173` and the API on port `3001`. The client-side review prototype can be explored without configuring an AI key or MongoDB. For legacy API routes, configure `server/.env` from `server/.env.example`; the API uses `AI_API_KEY`, `AI_BASE_URL`, and optionally `MONGO_URI`.
