# Inkloom AI

Inkloom helps teams review content before publication. It compares text with approved terminology, flags common issues such as unsupported promotional claims and inaccessible link labels, explains why it flagged them, and leaves revisions and approval decisions to people.

## Run locally

Requirements: Node.js 18 or newer.

```sh
npm install
npm install --prefix client
npm install --prefix server
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The governance review prototype runs in the browser and does not require an AI key or database. The Express API on port `3001` still serves the earlier staged brand-creation endpoints and authentication flows; those endpoints are not used by the current review workspace. See [docs/architecture.md](./docs/architecture.md) for details.

## Prototype workflow

1. Add preferred-term substitutions under **Guidelines**, for example `users → customers`.
2. Paste a text draft into **Review content** and select its content type.
3. Inspect each finding, its explanation, rule reference, and optional wording suggestion.
4. Request approval, request changes, or approve as a human reviewer. Add a reviewer name or decision note if useful.
5. Browse saved reviews and local governance insights.

Drafts, terminology rules, and review decisions are saved in the current browser's `localStorage`. They are not shared with a team or synchronized to a server.

## Responsible use and current limits

- The current checks are deterministic browser-side rules, not an AI model or factual verification service.
- The prototype reviews pasted text only. It does not parse documents or images, inspect visual assets, or verify claims against approved source material.
- Automated findings can be incomplete or incorrect. A human must review the content and make the publication decision; Inkloom never publishes it.
- This version has no shared workspaces, role-based access control, or centralized team analytics.
- Avoid using confidential production content in a prototype or shared device. Content and review records remain in browser storage until cleared.

The repository includes the prior brand-generation API and related UI components as legacy code; these are not the primary Inkloom governance product flow.
