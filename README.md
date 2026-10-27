# Inkloom AI

**A human-led brand-governance workspace for reviewing content before it is published.**

Inkloom helps a team check draft copy against its preferred terminology and a small set of explainable writing rules. Reviewers can inspect findings, compare delivery styles, stress-test wording, record a decision, and revisit saved drafts. Standard text checks run in the browser. Optional chaos-test and screenshot previews send the requested draft or image to the server-configured AI provider; Inkloom does not publish content.

> **Prototype status:** Inkloom provides deterministic local checks, browser-local review history, optional AI-generated risk examples and screenshot observations, and human decision controls. AI results are not approval decisions or content verification. See [Current capabilities and limitations](#current-capabilities-and-limitations) before using it with real content.

## Contents

- [What Inkloom does](#what-inkloom-does)
- [Quick start](#quick-start)
- [Use the review workspace](#use-the-review-workspace)
- [Current capabilities and limitations](#current-capabilities-and-limitations)
- [Quality evaluation and feedback](#quality-evaluation-and-feedback)
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
6. Preview speech delivery, stress-test possible misreadings, compare draft revisions with approved examples, or inspect a screenshot. These previews never set a review status.

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
10. Use **Voice-Actor Preview** to compare browser-synthesized delivery styles. Run **Chaos-Test My Copy** for AI-generated risk examples, or open the upload tab for **Screenshot-to-Review**. These previews do not change the human review status.
11. Open **Brand Drift Time Machine** in the sidebar to compare saved drafts with approved examples and inspect draft revisions.
12. Use **Report incorrect finding** under any finding, or **Report a missed issue** below the findings, to record reviewer feedback. Open **Quality Evaluation** in the sidebar to see precision and recall against labeled sample drafts and to triage the reports. These reports never change a review decision.

Changes to terminology and review decisions are stored in the browser’s `localStorage`. They are not shared with other users or devices.

## Current capabilities and limitations

| Area | Available in this prototype |
| --- | --- |
| Content input | Pasted text, supported text files, and screenshot images, with a selected content type |
| Terminology | User-defined preferred-term substitutions |
| Writing checks | Unsupported absolute/comparative wording, configured terminology, generic link labels, long sentences, and repeated all-caps wording |
| Findings | Excerpt, explanation, check/source label, and suggested next step |
| Suggestions and remixes | Optional deterministic wording replacements and previews, rechecked against local rules before applying |
| Brand Twin Debate | Rule-grounded summary of configured findings and review limitations; no generated opinions or approval score |
| Judge Mode | Guided, non-persisted sample walkthrough of findings, remix preview, and human decision |
| Human review | Draft, awaiting approval, changes requested, and approved decisions; optional reviewer and note |
| Voice-Actor Preview | Browser speech synthesis with warm expert, bold challenger, and calm guide delivery styles; preview only |
| Chaos-Test My Copy | Optional server-side AI examples of possible misunderstanding, out-of-context readings, and unsupported promises |
| Brand Drift Time Machine | Browser-local phrase overlap, selected promise/tone signals, and saved revision timeline against an approved example |
| Quality evaluation and feedback | Labeled sample drafts with expected findings, precision and recall scoring, regression tests, and browser-local reviewer reports of incorrect findings or missed issues; never an approval |
| Screenshot-to-Review | Optional server-side AI extraction of visible copy and advisory contrast/readability observations from PNG, JPEG, or WebP screenshots |
| History and insights | Summaries derived from browser-local review records |
| Account deletion | Profile action removes personal account and membership; deletion is blocked while the account owns a workspace |

The following are **not implemented in the current governance workflow**:

- Verification of facts or promotional claims against approved source documents
- Full accessibility measurement, OCR guarantees, or comprehensive image/document/video review
- Shared team workspaces, collaboration across devices, or role-based permissions
- Centralized analytics, publication integrations, or automatic publishing
- Guaranteed detection of every brand, legal, factual, or accessibility issue

The claims check flags selected absolute or comparative wording. It does not determine whether a claim is true; its explanation indicates that approved evidence was not supplied to the checker.

## Quality evaluation and feedback

Inkloom measures how well its own automated checks work instead of assuming they are right.

- **Labeled sample drafts.** `client/src/lib/evaluation/goldenSet.js` holds sample drafts with the findings a human reviewer would expect, including tricky cases such as the word “best” in “best practices” and legitimate acronyms.
- **Scoring.** `evaluate.js` runs the checks on every sample and counts correct findings, false positives (flagged but not an issue) and missed issues, giving precision, recall and a per-check breakdown.
- **Regression tests.** `npm test --prefix client` fails if a check disagrees with a labeled sample, if precision or recall falls below the recorded baseline, or if a documented gap is fixed without updating the labels.
- **Reviewer feedback.** Reviewers can use **Report incorrect finding** or **Report a missed issue** on the review screen. Each report keeps only a short window of text around the finding, never the whole draft, and duplicates are ignored.
- **Quality Evaluation page.** The sidebar page shows the scores, the known gaps and the saved reports. A person can copy a report as a labeled-sample draft and mark it added or dismissed; nothing is added to the sample set automatically.

At the time of writing the 14 labeled samples give about 85% precision and 73% recall. Five samples are documented known gaps, such as percentage claims (`100%`), synonyms like “unbeatable”, and acronyms being read as shouting.

Evaluation never approves, rejects or changes the status of a draft. Limits: the sample set is small and tests only the rule-based checks, scores do not certify accuracy for every organisation, and reports are stored in the browser until shared review storage exists.

## How the application is structured

### Governance client

The React/Vite client runs deterministic checks in [`client/src/lib/governance.js`](./client/src/lib/governance.js) and stores review records and terminology rules in browser storage via [`client/src/lib/reviewStore.js`](./client/src/lib/reviewStore.js). The voice preview uses browser speech synthesis. The optional chaos-test and screenshot tools call the server; their inputs are not stored by the application.

### Express API

The Express server in `server/` also provides optional AI review tools and account deletion. Chaos-test requests use the configured AI provider; screenshot reviews need a provider/model that accepts vision input. Account deletion requires a valid sign-in token and MongoDB.

For more detail, see [docs/architecture.md](./docs/architecture.md) and [docs/prompt-design.md](./docs/prompt-design.md).

## Run tests and create a production build

Run the client tests:

```sh
npm test --prefix client
```

Run the server tests:

```sh
npm test --prefix server
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

The client tests also include the quality-evaluation regression suite, which scores the checks against the labeled sample drafts and guards the precision and recall baseline.

## Optional server configuration

The standard browser-based review workflow does not need server configuration. To enable chaos testing or screenshot review, deploy the Express server and configure an AI provider. Screenshot review needs a vision-capable model: set `AI_VISION_MODEL`, or choose a vision-capable `AI_MODEL`. Copy [`server/.env.example`](./server/.env.example) to `server/.env` for local setup. Never commit `.env` files or real credentials.

| Variable | Used for |
| --- | --- |
| `PORT` | API listening port; defaults to `3001` |
| `CLIENT_ORIGIN` | Allowed client origin for CORS and authentication redirects |
| `AI_API_KEY` | Provider key for AI review tools and legacy AI stage endpoints |
| `AI_BASE_URL` | OpenAI-compatible chat/completions endpoint |
| `AI_MODEL` | Provider model name; use a vision-capable model for screenshot review |
| `AI_VISION_MODEL` | Optional vision model for screenshots; defaults to `AI_MODEL` |
| `JWT_SECRET` | Signing authentication tokens |
| `MONGO_URI` | MongoDB connection for account deletion, workspaces, and legacy brand-session persistence |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Optional Google OAuth |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` | Optional GitHub OAuth |
| `BREVO_API_KEY`, `EMAIL_FROM` | Optional password-reset email delivery |

Provider and database configuration enables the optional server features. The main rule-based review remains local; AI-generated previews only run when explicitly requested.

## Privacy and responsible use

- Review drafts and terminology rules remain in the current browser profile’s `localStorage`; anyone with access to that browser profile may be able to access them.
- When requested, chaos-test text and screenshot images are sent through the Inkloom server to the configured AI provider. Do not use confidential or regulated content unless that provider is approved for it.
- Account deletion removes the signed-in user, their workspace membership links, and local review history and projects in the current browser. Shared workspace records and audit history are preserved; audit attribution is anonymized. Accounts that own workspaces cannot currently be deleted.
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
│       ├── lib/            Governance rules, browser storage, tests, and quality evaluation (lib/evaluation)
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