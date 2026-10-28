import assert from "node:assert/strict";
import test from "node:test";
import {
  FEEDBACK_TYPES,
  addFeedback,
  contextAround,
  createMemoryStorage,
  listFeedback,
  summarizeFeedback,
  toGoldenSampleDraft,
  updateTriage,
} from "./feedbackStore.js";

const incorrect = {
  type: FEEDBACK_TYPES.INCORRECT_FINDING,
  check: "claim",
  excerpt: "best",
  content: "Read our best practices guide for onboarding new teammates this quarter.",
  reviewId: "review_1",
  reviewerName: "Asha",
};

test("saves an incorrect-finding report with a short context window", () => {
  const storage = createMemoryStorage();
  const { record, duplicate } = addFeedback(incorrect, storage);
  assert.equal(duplicate, false);
  assert.equal(record.triage, "new");
  assert.ok(record.context.includes("best practices"));
  assert.ok(record.context.length <= 240);
  assert.equal(listFeedback(storage).length, 1);
});

test("does not store duplicate reports for the same finding", () => {
  const storage = createMemoryStorage();
  addFeedback(incorrect, storage);
  const second = addFeedback({ ...incorrect, excerpt: "BEST" }, storage);
  assert.equal(second.duplicate, true);
  assert.equal(listFeedback(storage).length, 1);
});

test("validates feedback before saving", () => {
  const storage = createMemoryStorage();
  assert.throws(() => addFeedback({ ...incorrect, type: "other" }, storage), /incorrect or an issue was missed/);
  assert.throws(() => addFeedback({ ...incorrect, check: "nope" }, storage), /which check/);
  assert.throws(() => addFeedback({ ...incorrect, excerpt: "" }, storage), /exact text/);
  assert.throws(
    () => addFeedback({ type: FEEDBACK_TYPES.MISSED_ISSUE, check: "claim", excerpt: "unbeatable" }, storage),
    /Describe the issue/,
  );
  assert.equal(listFeedback(storage).length, 0);
});

test("whole-draft checks do not need an excerpt", () => {
  const storage = createMemoryStorage();
  const { record } = addFeedback({ type: FEEDBACK_TYPES.MISSED_ISSUE, check: "all-caps", note: "ACT NOW and SAVE BIG reads as shouting" }, storage);
  assert.equal(record.excerpt, "");
});

test("summarizes feedback by type and check, and tracks triage", () => {
  const storage = createMemoryStorage();
  const first = addFeedback(incorrect, storage).record;
  addFeedback({ type: FEEDBACK_TYPES.MISSED_ISSUE, check: "claim", excerpt: "Unbeatable", note: "Superlative not detected" }, storage);
  assert.deepEqual(summarizeFeedback(listFeedback(storage)), {
    total: 2,
    incorrect: 1,
    missed: 1,
    awaitingTriage: 2,
    byCheck: { claim: { incorrect: 1, missed: 1 } },
  });
  updateTriage(first.id, "dismissed", storage);
  assert.equal(summarizeFeedback(listFeedback(storage)).awaitingTriage, 1);
  assert.throws(() => updateTriage(first.id, "approved", storage), /Unknown triage state/);
});

test("turns feedback into a candidate golden sample that needs human confirmation", () => {
  const storage = createMemoryStorage();
  const wrong = addFeedback(incorrect, storage).record;
  const draft = toGoldenSampleDraft(wrong);
  assert.deepEqual(draft.expected, []);
  assert.equal(draft.needsHumanConfirmation, true);

  const missed = addFeedback({ type: FEEDBACK_TYPES.MISSED_ISSUE, check: "claim", excerpt: "Unbeatable", note: "Not detected", content: "Unbeatable quality for your team." }, storage).record;
  assert.deepEqual(toGoldenSampleDraft(missed).expected, [{ check: "claim", excerpt: "Unbeatable" }]);
});

test("feedback never changes saved reviews or their decisions", () => {
  const reviews = JSON.stringify([{ id: "review_1", status: "Awaiting approval", content: "Draft" }]);
  const storage = createMemoryStorage({ "inkloom-reviews": reviews });
  addFeedback(incorrect, storage);
  assert.equal(storage.getItem("inkloom-reviews"), reviews);
});

test("context window never contains the whole long draft", () => {
  const longDraft = `${"word ".repeat(200)}best${" word".repeat(200)}`;
  assert.ok(contextAround(longDraft, "best").length <= 240);
});