# Inkloom AI

**A human-led brand-governance workspace for reviewing content before it is published.**

Inkloom helps a team check draft copy against its preferred terminology and a small set of explainable writing rules. Reviewers can inspect findings, consider suggested wording, record a decision, and revisit saved drafts. The current review prototype runs in the browser: it does not send review text to an AI service or publish content.

> **Prototype status:** Inkloom currently provides deterministic checks for pasted text, browser-local review history, and human decision controls. It is not a production governance or content-verification service. See [Current capabilities and limitations](#current-capabilities-and-limitations) before using it with real content.

## Contents

- [What Inkloom does](#what-inkloom-does)
- [Quick start](#quick-start)
- [Use the review workspace](#use-the-review-workspace)
- [Current capabilities and limitations](#current-capabilities-and-limitations)
- [How the application is structured](#how-the-application-is-structured)
- [Run tests and create a production build](#run-tests-and-create-a-production-build)
- [Optional server configuration](#optional-server-configuration)
- [Privacy and responsible use](#privacy-and-responsible-use)
- [Project layout](#project-layout)
- [Documentation](#documentation)

## What Inkloom does

Organisations create content through many people and tools. Without a clear review process, drafts can drift from approved language, make claims without evidence, or overlook basic readability and accessibility practices. Inkloom is intended to make those issues easier to spot and discuss before publication.

The current prototype demonstrates a simple review loop:

1. Maintain preferred-term substitutions.
2. Paste a draft and choose its content type.
3. Review explainable findings and optional wording suggestions.
4. Ask for approval, request changes, or record a human approval.
5. Return to saved reviews and see lightweight, browser-local insights.

**The goal is to help reviewers make informed decisions—not to replace their judgment.**

## Quick start

### Requirements

- Node.js 18 or newer
- npm

### Install and run

From the repository root, install dependencies for the root scripts, client, and server:

```sh
npm install
npm install --prefix client
npm install --prefix server
```

Start the client and server together:

```sh
npm run dev
```

Open the Vite URL printed in the terminal, normally [http://localhost:5173](http://localhost:5173). The review workflow can be explored without an AI provider key or MongoDB configuration. The API starts on port `3001` by default.

To run only one part of the application:

```sh
npm run dev:client
npm run dev:server
```

The client is the main Inkloom governance experience. Starting the server is useful for exploring the repository’s separate, legacy API flows; the current review analyzer does not depend on it.

### Windows / VS Code

1. Open the repository folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Run the install commands above, then `npm run dev`.
4. Follow the Vite link shown in the terminal.
5. Stop the development processes with **Ctrl+C**.

## Use the review workspace

1. Select **Guidelines** and add preferred terms, one substitution per line. For example:

   ```text
   users → customers
   ```

   Both `→` and `->` are accepted as separators.

2. Select **Review a draft** and choose a content type.
3. Paste draft text and choose **Review content**.
4. Read each finding’s excerpt, explanation, source rule, and suggested next step.
5. Compare the rule-grounded arguments in **Brand Twin Debate**. The debate summarizes configured findings and review limitations; it is not AI-generated.
6. Preview a **Brand-safe remix**, compare its updated local-check results, and apply it only if the wording is right. These deterministic edits are limited to configured terms, selected claim wording, common filler phrases, and long sentences with safe semicolon splits.
7. Add a reviewer name or note and record a human decision.
8. Use **Try Judge Mode** to walk through a sample review, remix, and human decision. The sample does not appear in review history.
9. Visit **Review history** or **Insights** to review items saved in this browser.

Changes to terminology and review decisions are stored in the browser’s `localStorage`. They are not shared with other users or devices.

## Current capabilities and limitations

| Area | Available in this prototype |
| --- | --- |
| Content input | Pasted text, with a selected content type |
| Terminology | User-defined preferred-term substitutions |
| Writing checks | Unsupported absolute/comparative wording, configured terminology, generic link labels, long sentences, and repeated all-caps wording |
| Findings | Excerpt, explanation, check/source label, and suggested next step |
| Suggestions and remixes | Optional deterministic wording replacements and previews, rechecked against local rules before applying |
| Brand Twin Debate | Rule-grounded summary of configured findings and review limitations; no generated opinions or approval score |
| Judge Mode | Guided, non-persisted sample walkthrough of findings, remix preview, and human decision |
| Human review | Draft, awaiting approval, changes requested, and approved decisions; optional reviewer and note |
| History and insights | Summaries derived from browser-local review records |

The following are **not implemented in the current governance workflow**:

- AI-generated or model-based review
- Verification of facts or promotional claims against approved source documents
- Image, document, video, or visual-asset review
- Shared team workspaces, collaboration across devices, or role-based permissions
- Centralized analytics, publication integrations, or automatic publishing
- Guaranteed detection of every brand, legal, factual, or accessibility issue

The claims check flags selected absolute or comparative wording. It does not determine whether a claim is true; its explanation indicates that approved evidence was not supplied to the checker.

## How the application is structured

### Governance client

The React/Vite client runs the current review experience. The analyzer in [`client/src/lib/governance.js`](./client/src/lib/governance.js) applies deterministic text and pattern checks. [`client/src/lib/reviewStore.js`](./client/src/lib/reviewStore.js) reads and writes review records and terminology rules in browser storage. No API request is made by this review flow to process the draft.

### Express API

The Express server in `server/` retains an earlier staged brand-creation API and authentication routes. It is separate from the current local governance analyzer. Some API flows require configuration such as an AI provider, JWT secret, OAuth credentials, or MongoDB; these are not required to try the browser-based review workflow.

For more detail, see [docs/architecture.md](./docs/architecture.md) and [docs/prompt-design.md](./docs/prompt-design.md).

## Run tests and create a production build

Run the client tests:

```sh
npm test --prefix client
```

Create the optimized client build:

```sh
npm run build --prefix client
```

To serve the built client locally for a manual check:

```sh
npm run preview --prefix client
```

The client’s tests cover representative governance-rule behavior. They do not certify the analyzer’s completeness or correctness for every organisation or content type.

## Optional server configuration

The current browser-based review workflow does not need server configuration. If you want to explore the legacy API, copy [`server/.env.example`](./server/.env.example) to `server/.env` and configure only the services you intend to use. Never commit `.env` files or real credentials.

| Variable | Used for |
| --- | --- |
| `PORT` | API listening port; defaults to `3001` |
| `CLIENT_ORIGIN` | Allowed client origin for CORS and authentication redirects |
| `AI_API_KEY` | Provider key for legacy AI stage endpoints |
| `AI_BASE_URL` | OpenAI-compatible chat/completions endpoint for legacy AI stages |
| `AI_MODEL` | Model name for legacy AI stages |
| `JWT_SECRET` | Signing authentication tokens |
| `MONGO_URI` | Optional MongoDB connection for legacy brand-session persistence |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Optional Google OAuth |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` | Optional GitHub OAuth |
| `BREVO_API_KEY`, `EMAIL_FROM` | Optional password-reset email delivery |

Provider and database configuration only enables the corresponding legacy server features; it does not add AI or approved-source verification to the governance review flow.

## Privacy and responsible use

- Review drafts and terminology rules remain in the current browser profile’s `localStorage`; anyone with access to that browser profile may be able to access them.
- Clearing browser storage removes local review records and guidelines. There is no team backup or synchronization.
- Do not paste confidential, personal, regulated, or production-sensitive content into this prototype unless your organisation has approved that use and device.
- Automated checks can produce false positives and miss issues. Treat every result as a prompt for human review, not as legal, factual, security, accessibility, or publication clearance.
- The prototype does not publish content. A person remains responsible for the final decision.

## Project layout

```text
.
├── client/                 React, Vite, styles, and governance workspace
│   └── src/
│       ├── components/     Shared UI components
│       ├── context/        Client-side contexts
│       ├── lib/            Governance rules, browser storage, and tests
│       └── pages/          Landing page and application views
├── server/                 Express API and legacy AI/authentication flows
│   └── src/
│       ├── ai/             Legacy prompts, schemas, and stage runner
│       ├── controllers/    API request handlers
│       ├── models/         MongoDB models
│       └── routes/         API routes
└── docs/                   Architecture, prompt design, and submission materials
```

## Documentation

- [Architecture overview](./docs/architecture.md)
- [Legacy AI prompt design](./docs/prompt-design.md)
- [Round 1 plan](./docs/Inkloom-AI-Round-1-Plan.html)
