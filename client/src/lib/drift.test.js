import assert from "node:assert/strict";
import test from "node:test";
import { compareDrafts, extractPhrases, reviewVersions } from "./drift.js";

test("compares phrases and identifies promise and tone signals", () => {
  const comparison = compareDrafts(
    "We guarantee instant results for every team. Thanks for joining our community.",
    "We may help teams get started. Thanks for joining our community.",
  );

  assert.ok(comparison.overlap > 0 && comparison.overlap < 100);
  assert.ok(comparison.added.some((phrase) => phrase.includes("guarantee")));
  assert.deepEqual(comparison.draftPromises, ["guarantee", "instant"]);
  assert.equal(comparison.tone.Warmth.draft, 2);
  assert.equal(comparison.tone.Caution.approved, 2);
});

test("returns no fabricated phrase differences for matching copy", () => {
  const comparison = compareDrafts("Our team shares updates every week.", "Our team shares updates every week.");

  assert.equal(comparison.overlap, 100);
  assert.deepEqual(comparison.added, []);
  assert.deepEqual(comparison.removed, []);
});

test("builds a chronological timeline from saved revisions and current draft", () => {
  const versions = reviewVersions({
    id: "review-1",
    status: "Approved",
    content: "Current copy",
    updatedAt: 30,
    revisionHistory: [
      { content: "Newer saved copy", updatedAt: 20 },
      { content: "Oldest copy", updatedAt: 10 },
    ],
  });

  assert.deepEqual(versions.map((version) => version.content), ["Oldest copy", "Newer saved copy", "Current copy"]);
});

test("limits phrases to readable multi-word spans", () => {
  const phrases = extractPhrases("The team supports every creator.");

  assert.ok(phrases.has("team supports"));
  assert.ok(phrases.has("every creator"));
  assert.equal(phrases.has("of the"), false);
});
