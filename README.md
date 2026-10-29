# Inkloom AI

**A human-led brand-governance workspace for reviewing content before it is published.**

Inkloom helps a team check draft copy against its preferred terminology and a small set of explainable writing rules. Reviewers can inspect findings, compare delivery styles, stress-test wording, record a decision, and revisit saved drafts. Standard text checks run in the browser. Optional chaos-test and screenshot previews send the requested draft or image to the server-configured AI provider; Inkloom does not publish content.

> **Prototype status:** Inkloom provides deterministic local checks, browser-local review history, optional AI-generated risk examples and screenshot observations, and human decision controls. AI results are not approval decisions or content verification. See [Current capabilities and limitations](#current-capabilities-and-limitations) before using it with real content.

## Contents

- [What's new](#whats-new)
- [What Inkloom does](#what-inkloom-does)
- [Quick start](#quick-start)
- [Use the review workspace](#use-the-review-workspace)
- [Navigation](#navigation)
- [Claim Review](#claim-review)
- [Claim Review first-time tutorial](#claim-review-first-time-tutorial)
- [Brand Drift Time Machine and review history](#brand-drift-time-machine-and-review-history)
- [Company Admin workspace and access](#company-admin-workspace-and-access)
- [Current capabilities and limitations](#current-capabilities-and-limitations)
- [Quality evaluation and feedback](#quality-evaluation-and-feedback)
- [How the application is structured](#how-the-application-is-structured)
- [Run tests and create a production build](#run-tests-and-create-a-production-build)
- [Optional server configuration](#optional-server-configuration)
- [Privacy and responsible use](#privacy-and-responsible-use)
- [Project layout](#project-layout)
- [Documentation](#documentation)

## What's new

This release makes two changes to the review workspace.

1. **Claim Review first-time tutorial.** The first time a person opens **Claim Review**, a step-by-step tutorial window appears over a blurred background. The person clicks **Next** through every required step and then **Finish** to unlock the feature. The tutorial is shown once per browser and does not appear on later visits. See [Claim Review first-time tutorial](#claim-review-first-time-tutorial).
2. **Review history in Brand Drift Time Machine.** Saved reviews from the **Review history** section now appear inside **Brand Drift Time Machine**, shown as a visual drift timeline of "review capsules" instead of a plain list. See [Brand Drift Time Machine and review history](#brand-drift-time-machine-and-review-history).

The normal steps for using Claim Review are unchanged. The tutorial only guides a first-time user through them.

## What Inkloom does

Organisations create content through many people and tools. Without a clear review process, drafts can drift from approved language, contain potentially unsupported claims, or overlook basic readability and accessibility practices. Inkloom helps teams identify these issues and review content before publication.

The current prototype demonstrates a simple review workflow:

1. Maintain preferred-term substitutions to ensure consistent brand language.
2. Paste a draft and choose its content type.
3. Review explainable findings, potential claim-related concerns, and optional wording suggestions.
4. Use **Claim Review** to examine claims in draft content and assess potential issues. First-time users are guided through a one-time step-by-step tutorial.
5. Compare rule-grounded findings, explore alternative wording, and revisit draft revisions against approved examples.
6. Preview speech delivery, stress-test possible misinterpretations, or inspect screenshots for visible content and potential readability or contrast concerns.
7. Record human decisions, request changes, and revisit saved reviews through browser-local history and insights.
8. Open **Brand Drift Time Machine** to see saved review history on a visual drift timeline, compared against approved examples.
9. Use the **Company Admin** workspace (Admin accounts only) to manage company-level settings.

Claim Review complements Inkloom's existing governance checks by helping reviewers examine claims before publication. Automated findings are advisory and should not be treated as definitive proof of factual accuracy or as a substitute for supporting evidence and human judgment.

**The goal is to help reviewers make informed decisions, not to replace their judgment.**

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

The client is the main Inkloom governance experience. Starting the server is useful for exploring the repository's separate, legacy API flows and for account sign-up, sign-in, and the Company Admin workspace; the current review analyzer does not depend on it.

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
4. Read each finding's excerpt, explanation, source rule, and suggested next step.
5. Compare the rule-grounded arguments in **Brand Twin Debate**. The debate summarizes configured findings and review limitations; it is not AI-generated.
6. Preview a **Brand-safe remix**, compare its updated local-check results, and apply it only if the wording is right. These deterministic edits are limited to configured terms, selected claim wording, common filler phrases, and long sentences with safe semicolon splits.
7. Add a reviewer name or note and record a human decision.
8. Use **Try Judge Mode** to walk through a sample review, remix, and human decision. The sample does not appear in review history.
9. Visit **Review history** or **Insights** to review items saved in this browser.
10. Use **Voice-Actor Preview** to compare browser-synthesized delivery styles. Run **Chaos-Test My Copy** for AI-generated risk examples, or open the upload tab for **Screenshot-to-Review**. These previews do not change the human review status.
11. Open **Brand Drift Time Machine** in the sidebar to see your saved reviews as a drift timeline, compare saved drafts with approved examples, and inspect draft revisions. See [Brand Drift Time Machine and review history](#brand-drift-time-machine-and-review-history).
12. Open **Claim Review** to review claims in your draft. The first time you open it, complete the [first-time tutorial](#claim-review-first-time-tutorial). After that, examine the identified claims and review results to determine whether further clarification, revision, or supporting evidence may be needed. Claim Review supports the review process but does not automatically establish the factual accuracy of every claim.
13. Use **Report incorrect finding** under any finding, or **Report a missed issue** below the findings, to record reviewer feedback. Open **Quality Evaluation** in the sidebar to see precision and recall against labeled sample drafts and to triage the reports. These reports never change a review decision.
14. Open **Company Admin** in the sidebar if you are signed in with an Admin account. See [Company Admin workspace and access](#company-admin-workspace-and-access).

Changes to terminology and review decisions are stored in the browser's `localStorage`. They are not shared with other users or devices.

## Navigation

Users can move freely between sections (for example from the dashboard to **Claim Review** and then to **Company Admin**). To avoid having to retrace every step:

- A **Back** control is shown at the **top-left corner** of every section page.
- Hovering over it shows the tooltip **"Back to the Homepage"**.
- Clicking it takes the user **directly to the homepage**, regardless of how many sections they visited beforehand. It does not step back through the visited sections one by one.
- The control is keyboard accessible, and the same label is exposed to screen readers (`aria-label="Back to the Homepage"`).

## Claim Review

Claim Review is a dedicated workflow for examining claims in a draft before publication.

- It identifies selected absolute or comparative wording and other potential claim-related concerns.
- Each result explains why it was flagged and indicates that approved evidence was not supplied to the checker.
- Results are advisory. They do not verify facts, promotional claims, or legal compliance.
- A person decides whether a claim needs clarification, revision, or supporting evidence.
- The first time a person opens the section, a [guided tutorial](#claim-review-first-time-tutorial) explains the steps above before the feature becomes available.

## Claim Review first-time tutorial

To help new users understand the required steps, Claim Review opens with a one-time, step-by-step tutorial window.

### How it behaves

- **Shown once.** The tutorial appears only the first time a person enters the Claim Review section in a given browser. It does not appear on later visits.
- **Blurred background.** While the tutorial is open, the page behind it is blurred and cannot be clicked, so attention stays on the current step.
- **Step by step.** The window shows one step at a time with a step counter (for example "Step 2 of 5"). The person clicks **Next** to move forward. A **Previous** control lets them re-read an earlier step.
- **Must be completed.** All steps are required. The tutorial has no skip or close option, and Claim Review stays locked until the last step is reached.
- **Finish unlocks the feature.** On the last step, **Next** is replaced by **Finish**. Clicking **Finish** closes the window, removes the blur, and gives the person full access to Claim Review.
- **Remembered afterwards.** Finishing the tutorial stores a completion flag in the browser's `localStorage` (for example `inkloom.claimReviewTutorialDone`). Because it is stored per browser, a different browser or device, or cleared browser storage, will show the tutorial again.

### Steps covered

1. **Add your draft.** Paste or load the draft whose claims you want to examine, and choose its content type.
2. **Run the claim check.** Start the check to identify absolute or comparative wording and other potential claim-related concerns.
3. **Read each result.** Each result shows the excerpt, why it was flagged, and that approved evidence was not supplied to the checker.
4. **Decide what to do.** Choose whether a claim needs clarification, revision, or supporting evidence. Results are advisory and do not verify facts.
5. **Record your decision.** Add a reviewer name or note and record the human decision.

### Accessibility

- The window uses `role="dialog"` with `aria-modal="true"` and a labelled title.
- Focus moves into the window when it opens, stays inside it while it is open, and returns to the Claim Review page when it closes.
- **Next**, **Previous**, and **Finish** work with the keyboard (Tab, Enter, Space).
- The blur effect respects the user's reduced-motion preference: the blur is applied without animated transitions.

## Brand Drift Time Machine and review history

Saved reviews from the **Review history** section now also appear in **Brand Drift Time Machine**. Earlier, the Time Machine did not show this information.

### Where the data comes from

The Time Machine reads the same browser-local review records that power **Review history** and **Insights**. Nothing is sent to a server, and there is no second copy of the data. When a review is saved or its decision changes, the Time Machine reflects it the next time it is opened.

### The drift timeline (unique format)

Instead of a plain table, review history is shown as a **drift timeline of review capsules**:

- **Capsules on a time axis.** Each saved review is a capsule card placed on a vertical timeline, newest first, grouped by day. Capsules for revisions of the same draft are joined by a connecting line so a draft's journey is easy to follow.
- **Drift meter.** Each capsule has a small gauge showing how far that version has moved from the selected approved example. The meter is based on the Time Machine's existing local signals (phrase overlap and selected promise and tone signals). It is a comparison aid, not a quality score or an approval.
- **Drift trend ribbon.** A compact sparkline above the timeline shows how drift changed across saved reviews over time, so rising or falling drift is visible at a glance.
- **Capsule details.** Each capsule shows the content type, date and time, review status (draft, awaiting approval, changes requested, or approved), number of findings, and the reviewer name or note if one was recorded.
- **Expand to compare.** Selecting a capsule opens a side-by-side view of that version against the approved example, with differing phrases highlighted. Selecting two capsules of the same draft compares the two revisions.
- **Filters.** Reviews can be filtered by content type and by status, and the timeline can be narrowed to a date range.
- **Empty state.** If there are no saved reviews yet, the section explains that history appears once a review has been saved, and links to **Review a draft**.
- **Keyboard and screen-reader support.** Capsules are focusable, expandable with Enter or Space, and expose their date, status, and drift level as text, so meaning is never conveyed by colour alone.

The timeline is read-only. Viewing or comparing history never changes a review's status or decision.

## Company Admin workspace and access

The **Company Admin** section is restricted to people who registered as Admins.

### Who can access it

- Only users who **registered an account as a Company Admin**, and are **currently signed in** with that account, can open the Admin workspace and its tools (including creating a company workspace).
- Normal users, and visitors who are not signed in, cannot use the Admin workspace.
- Access is decided by the role stored on the account at registration and checked after sign-in. To use the Admin workspace, sign in with an Admin account.

### What a normal user sees

Normal users do **not** see the "Create company workspace" option. Instead, the Company Admin section shows this message:

> **If you are an Admin, you can access the Admin workspace.**
> The Admin workspace is only accessible to Company Admins. To access it, sign in as an Admin.

### Loading behaviour

- The Company Admin section renders its layout and content **immediately** when opened, with no multi-minute wait.
- The access check and any workspace data load in the background; while data loads, the page shows its structure and a lightweight loading state instead of a blank screen.
- If the access check or data request fails, the section shows a clear error with a retry action rather than staying empty.

> **Developer note:** Always enforce the Admin role on the server for every Admin endpoint (verify the signed-in user's token and role). Hiding the option in the client improves the experience but is not a security control on its own.

## Current capabilities and limitations

| Area | Available in this prototype |
| --- | --- |
| Content input | Pasted text, supported text files, and screenshot images, with a selected content type |
| Terminology | User-defined preferred-term substitutions |
| Writing checks | Unsupported absolute/comparative wording, configured terminology, generic link labels, long sentences, and repeated all-caps wording |
| Claim Review | Dedicated workflow for reviewing claims and identifying potential issues; findings support human assessment and do not automatically verify factual accuracy |
| Claim Review tutorial | One-time, step-by-step tutorial window with blurred background, shown on first entry only; **Next** through all steps and **Finish** to unlock the feature; completion remembered per browser |
| Findings | Excerpt, explanation, check/source label, and suggested next step |
| Suggestions and remixes | Optional deterministic wording replacements and previews, rechecked against local rules before applying |
| Brand Twin Debate | Rule-grounded summary of configured findings and review limitations; no generated opinions or approval score |
| Judge Mode | Guided, non-persisted sample walkthrough of findings, remix preview, and human decision |
| Human review | Draft, awaiting approval, changes requested, and approved decisions; optional reviewer and note |
| Voice-Actor Preview | Browser speech synthesis with warm expert, bold challenger, and calm guide delivery styles; preview only |
| Chaos-Test My Copy | Optional server-side AI examples of possible misunderstanding, out-of-context readings, and unsupported promises |
| Brand Drift Time Machine | Browser-local phrase overlap, selected promise/tone signals, and saved revision timeline against an approved example; now also shows Review history as a drift timeline of review capsules with drift meter, trend ribbon, filters, and side-by-side comparison |
| Quality evaluation and feedback | Labeled sample drafts with expected findings, precision and recall scoring, regression tests, and browser-local reviewer reports of incorrect findings or missed issues; never an approval |
| Screenshot-to-Review | Optional server-side AI extraction of visible copy and advisory contrast/readability observations from PNG, JPEG, or WebP screenshots |
| History and insights | Summaries derived from browser-local review records; the same records feed the Brand Drift Time Machine timeline |
| Navigation | Top-left **Back to the Homepage** control on section pages that returns directly to the homepage |
| Company Admin | Instantly rendered section; workspace tools available only to signed-in users who registered as Admins; other users see an Admin-only notice and no "Create company workspace" option |
| Account deletion | Profile action removes personal account and membership; deletion is blocked while the account owns a workspace |

The following are **not implemented in the current governance workflow**:

- Verification of facts or promotional claims against approved source documents
- Full accessibility measurement, OCR guarantees, or comprehensive image/document/video review
- Shared team review workspaces, collaboration across devices, or fine-grained role-based permissions beyond the Admin / normal-user distinction
- Centralized analytics, publication integrations, or automatic publishing
- Guaranteed detection of every brand, legal, factual, or accessibility issue
- Syncing the Claim Review tutorial status or the drift timeline across browsers or devices (both are browser-local)

The claims check flags selected absolute or comparative wording. It does not determine whether a claim is true; its explanation indicates that approved evidence was not supplied to the checker. The drift meter compares wording and tone signals against an approved example; it does not measure factual accuracy or approval readiness.

## Quality evaluation and feedback

Inkloom measures how well its own automated checks work instead of assuming they are right.

- **Labeled sample drafts.** `client/src/lib/evaluation/goldenSet.js` holds sample drafts with the findings a human reviewer would expect, including tricky cases such as the word "best" in "best practices" and legitimate acronyms.
- **Scoring.** `evaluate.js` runs the checks on every sample and counts correct findings, false positives (flagged but not an issue) and missed issues, giving precision, recall and a per-check breakdown.
- **Regression tests.** `npm test --prefix client` fails if a check disagrees with a labeled sample, if precision or recall falls below the recorded baseline, or if a documented gap is fixed without updating the labels.
- **Reviewer feedback.** Reviewers can use **Report incorrect finding** or **Report a missed issue** on the review screen. Each report keeps only a short window of text around the finding, never the whole draft, and duplicates are ignored.
- **Quality Evaluation page.** The sidebar page shows the scores, the known gaps and the saved reports. A person can copy a report as a labeled-sample draft and mark it added or dismissed; nothing is added to the sample set automatically.

At the time of writing the 14 labeled samples give about 85% precision and 73% recall. Five samples are documented known gaps, such as percentage claims (`100%`), synonyms like "unbeatable", and acronyms being read as shouting.

Evaluation never approves, rejects or changes the status of a draft. Limits: the sample set is small and tests only the rule-based checks, scores do not certify accuracy for every organisation, and reports are stored in the browser until shared review storage exists.

## How the application is structured

### Governance client

The React/Vite client runs deterministic checks in [`client/src/lib/governance.js`](./client/src/lib/governance.js) and stores review records and terminology rules in browser storage via [`client/src/lib/reviewStore.js`](./client/src/lib/reviewStore.js). The voice preview uses browser speech synthesis. The optional chaos-test and screenshot tools call the server; their inputs are not stored by the application.

The client also handles section navigation (including the top-left **Back to the Homepage** control) and shows or hides Admin-only areas based on the signed-in account's role.

Two parts of the client were added or changed in this release:

- **Claim Review tutorial.** A tutorial component renders over the Claim Review page when the stored completion flag is missing. It applies a blurred, non-interactive overlay to the page, steps through the required guidance, and writes the completion flag to `localStorage` when the person clicks **Finish**. Claim Review's own controls are not available until then.
- **Drift timeline.** The Brand Drift Time Machine now reads saved review records from `reviewStore.js` (the same source as Review history and Insights) and renders them as the drift timeline of review capsules. It reuses the Time Machine's existing local drift signals and does not write to the review records.

### Express API

The Express server in `server/` provides sign-up and sign-in, role-based Admin access, optional AI review tools, and account deletion. Chaos-test requests use the configured AI provider; screenshot reviews need a provider/model that accepts vision input. Account deletion and Admin workspace actions require a valid sign-in token and MongoDB. Neither the Claim Review tutorial nor the drift timeline needs the server.

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

The client's tests cover representative governance-rule behavior. They do not certify the analyzer's completeness or correctness for every organisation or content type.

The client tests also include the quality-evaluation regression suite, which scores the checks against the labeled sample drafts and guards the precision and recall baseline.

### Manual check for this release

1. **Tutorial appears once.** Clear the tutorial completion flag (or use a private window), open **Claim Review**, and confirm the blurred tutorial window appears. Click **Next** through every step, click **Finish**, and confirm Claim Review is usable. Reload and reopen Claim Review to confirm the tutorial does not appear again.
2. **Drift timeline shows history.** Save at least two reviews, open **Brand Drift Time Machine**, and confirm they appear as capsules that match what **Review history** shows. With no saved reviews, confirm the empty state appears.

## Optional server configuration

The standard browser-based review workflow does not need server configuration. To enable chaos testing or screenshot review, deploy the Express server and configure an AI provider. Screenshot review needs a vision-capable model: set `AI_VISION_MODEL`, or choose a vision-capable `AI_MODEL`. To enable accounts and the Company Admin workspace, also configure `JWT_SECRET` and `MONGO_URI`. Copy [`server/.env.example`](./server/.env.example) to `server/.env` for local setup. Never commit `.env` files or real credentials.

| Variable | Used for |
| --- | --- |
| `PORT` | API listening port; defaults to `3001` |
| `CLIENT_ORIGIN` | Allowed client origin for CORS and authentication redirects |
| `AI_API_KEY` | Provider key for AI review tools and legacy AI stage endpoints |
| `AI_BASE_URL` | OpenAI-compatible chat/completions endpoint |
| `AI_MODEL` | Provider model name; use a vision-capable model for screenshot review |
| `AI_VISION_MODEL` | Optional vision model for screenshots; defaults to `AI_MODEL` |
| `JWT_SECRET` | Signing authentication tokens |
| `MONGO_URI` | MongoDB connection for accounts, account deletion, workspaces, and legacy brand-session persistence |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Optional Google OAuth |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` | Optional GitHub OAuth |
| `BREVO_API_KEY`, `EMAIL_FROM` | Optional password-reset email delivery |

Provider and database configuration enables the optional server features. The main rule-based review remains local; AI-generated previews only run when explicitly requested.

## Privacy and responsible use

- Review drafts and terminology rules remain in the current browser profile's `localStorage`; anyone with access to that browser profile may be able to access them.
- The Brand Drift Time Machine timeline is built from those same browser-local records. It does not upload or share review history.
- The Claim Review tutorial stores only a completion flag in `localStorage`. It contains no draft content or personal information.
- When requested, chaos-test text and screenshot images are sent through the Inkloom server to the configured AI provider. Do not use confidential or regulated content unless that provider is approved for it.
- The Company Admin workspace is available only to signed-in Admin accounts. Normal users cannot view or create company workspaces.
- Account deletion removes the signed-in user, their workspace membership links, and local review history and projects in the current browser. Shared workspace records and audit history are preserved; audit attribution is anonymized. Accounts that own workspaces cannot currently be deleted.
- Clearing browser storage removes local review records, guidelines, and the tutorial completion flag. There is no team backup or synchronization, and the tutorial will be shown again after storage is cleared.
- Do not paste confidential, personal, regulated, or production-sensitive content into this prototype unless your organisation has approved that use and device.
- Automated checks can produce false positives and miss issues. Treat every result as a prompt for human review, not as legal, factual, security, accessibility, or publication clearance.
- The prototype does not publish content. A person remains responsible for the final decision.

## Project layout

```text
.
├── client/                 React, Vite, styles, and governance workspace
│   └── src/
│       ├── components/     Shared UI components (including the Back to the Homepage control,
│       │                   the Claim Review tutorial window, and the drift timeline capsules)
│       ├── context/        Client-side contexts (including auth and role)
│       ├── lib/            Governance rules, browser storage, tests, and quality evaluation (lib/evaluation)
│       └── pages/          Landing page and application views (including Claim Review,
│                           Brand Drift Time Machine, and Company Admin)
├── server/                 Express API and legacy AI/authentication flows
│   └── src/
│       ├── ai/             Legacy prompts, schemas, and stage runner
│       ├── controllers/    API request handlers
│       ├── models/         MongoDB models
│       └── routes/         API routes (Admin routes require a valid Admin token)
└── docs/                   Architecture, prompt design, and submission materials
```

## Documentation

- [Architecture overview](./docs/architecture.md)
- [Legacy AI prompt design](./docs/prompt-design.md)
- [Round 1 plan](./docs/Inkloom-AI-Round-1-Plan.html)