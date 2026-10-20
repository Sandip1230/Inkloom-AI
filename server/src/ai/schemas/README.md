# Stage schemas

Each file here exports a plain field -> type map for one pipeline stage
(`'string'`, `'string[]'`, `'boolean'`, or `'object'`). `validate.js` checks
a parsed AI response against the matching schema before it is returned or
persisted. `index.js` maps a stage name (e.g. `"understand"`) to its schema.

`runStage.js` calls this automatically: if the parsed JSON is missing a
field or has the wrong type, the stage is retried once with the specific
list of problems appended to the prompt, exactly like a malformed-JSON
retry. If it still fails, the controller returns a 502.

Keep these aligned with the field names each stage's prompt in
`server/src/ai/prompts` actually asks for — see `docs/prompt-design.md`.