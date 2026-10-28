import assert from "node:assert/strict";
import test from "node:test";
import { annotateVersions, buildTimeline, compareDrafts, driftPercent, extractPhrases, reviewVersions, wordDiff } from "./drift.js";

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

test("word diff marks added and removed words", () => {
  const diff = wordDiff("We help teams ship faster", "We guarantee teams ship faster today");

  assert.equal(diff.added, 2);
  assert.equal(diff.removed, 1);
  assert.deepEqual(diff.parts.filter((part) => part.type === "add").map((part) => part.text), ["guarantee", "today"]);
  assert.deepEqual(diff.parts.filter((part) => part.type === "del").map((part) => part.text), ["help"]);
});

test("drift percent is 0 for identical copy and 100 for unrelated copy", () => {
  assert.equal(driftPercent("same words here", "same words here"), 0);
  assert.equal(driftPercent("alpha beta", "gamma delta"), 100);
  assert.equal(driftPercent("", ""), 0);
});

test("word diff is skipped for very long texts", () => {
  const long = Array.from({ length: 1600 }, (_, index) => `w${index}`).join(" ");
  assert.equal(wordDiff(long, "short"), null);
  assert.equal(typeof driftPercent(long, "short"), "number");
});

test("timeline lists reviews oldest first and ignores empty ones", () => {
  const timeline = buildTimeline([
    { id: "b", content: "Second", updatedAt: 20, status: "Approved" },
    { id: "a", content: "First", updatedAt: 10 },
    { id: "c", content: "   ", updatedAt: 30 },
    null,
  ]);

  assert.deepEqual(timeline.map((item) => item.id), ["a", "b"]);
  assert.equal(timeline[0].status, "Draft");
});

test("annotated versions carry word counts and drift from the previous version", () => {
  const versions = annotateVersions(reviewVersions({
    id: "r",
    content: "We guarantee results",
    updatedAt: 20,
    revisionHistory: [{ content: "We help results", updatedAt: 10 }],
  }));

  assert.equal(versions[0].drift, null);
  assert.equal(versions[1].words, 3);
  assert.ok(versions[1].drift > 0);
});