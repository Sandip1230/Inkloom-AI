# Inkloom architecture

Inkloom's current brand-governance prototype is a Vite/React client. Its review workspace runs deterministic text checks in the browser and stores draft reviews and terminology rules in `localStorage`. Review text is not sent to the API by the current workspace.

## Review workflow

1. A creator pastes a draft and selects its content type.
2. The local review engine checks absolute promotional claims, configured preferred terminology, descriptive link text, long sentences and repeated all-caps wording.
3. Each finding shows the reason, check that produced it and a suggested next step. Terminology and claim suggestions can be applied one at a time.
4. A human can save the draft as awaiting approval, request changes, or approve it, with an optional name and note.
5. The review history and insights pages summarize the items stored in that browser.

Terminology rules and review records are persisted under Inkloom-specific local-storage keys. Legacy authentication and theme keys are read where needed to avoid invalidating existing browser sessions and preferences. The Company Admin page uses authenticated, organization-scoped API data for workspaces, memberships, approved source documents, version history, audit events, and audit-log retention. Workspace roles are owner, admin, reviewer, and creator; management endpoints enforce permissions on the server, while role-specific access to the browser-only review workflow is not yet enforced. Members must already have an Inkloom account before an owner or admin can add them.

The governance API is a separate foundation from the browser-only review workflow: approved sources are not yet used by the review analyzer, review drafts and decisions are not stored in the workspace database, and audit retention does not apply to browser-local review records or source documents. The retention job purges expired audit events daily after MongoDB connects.

## Current review checks and limits

The analyzer lives in `client/src/lib/governance.js`; persistence helpers live in `client/src/lib/reviewStore.js`. It uses explicit string and pattern checks, not an AI model. Its results are signals for a reviewer, not a verification of truth, legal compliance, or accessibility conformance. Only text is reviewed. The admin API can store attributable, versioned source text, but source-grounded checks, images and assets, shared review records, and centralized review analytics are not connected.

## Existing API

The Express server provides authentication, workspace administration, and the earlier staged brand-creation API. Admin requests use `client/src/api/adminApi.js` and `/api/admin`; JWT authentication and workspace membership/role checks are enforced by the server. Stage requests use `client/src/api/brandApi.js`, are orchestrated by `server/src/ai/runStage.js`, validated against the schemas in `server/src/ai/schemas`, and can persist brand-session results in MongoDB. The current governance workflow does not call those stage endpoints. They should not be interpreted as the governance analyzer or as approved-source verification.

## Local development

Install dependencies in the root, `client`, and `server` directories, then start the frontend and backend together from the root:

```sh
npm install
npm install --prefix client
npm install --prefix server
npm run dev
```

The client runs on port `5173` and the API on port `3001`. The browser-local review workflow can be explored without an AI key or MongoDB. Company Admin requires MongoDB (`MONGO_URI`) and signed-in accounts (`JWT_SECRET`); Google and GitHub OAuth are optional and enabled only when each provider's client ID, secret, and callback URL are configured. Legacy AI stage routes use `AI_API_KEY` and `AI_BASE_URL`. Configure `server/.env` from `server/.env.example`.
