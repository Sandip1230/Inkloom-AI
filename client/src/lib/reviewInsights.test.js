import test from "node:test";
import assert from "node:assert/strict";
import { describeReview, wordCount } from "./reviewInsights.js";

test("wordCount counts words and tolerates empty input", () => {
  assert.equal(wordCount("one two  three\nfour"), 4);
  assert.equal(wordCount(""), 0);
  assert.equal(wordCount(undefined), 0);
});

test("describeReview summarises a reviewed draft with earlier versions", () => {
  const detail = describeReview({
    id: "r1",
    contentType: "Social post",
    content: "We are the best tool ever made today",
    status: "Approved",
    reviewer: "Asha",
    updatedAt: 2000,
    findings: [
      { category: "Promotional claim", excerpt: "best", suggestion: "Qualify it" },
      { category: "Promotional claim", excerpt: "ever" },
      { category: "Tone", excerpt: "ever" },
    ],
    revisionHistory: [{ content: "We are the best", updatedAt: 1000, findings: [{ category: "Promotional claim" }] }],
  });
  assert.equal(detail.findingCount, 3);
  assert.equal(detail.suggestions, 1);
  assert.deepEqual(detail.byCategory[0], { name: "Promotional claim", count: 2 });
  assert.equal(detail.versions.length, 2);
  assert.match(detail.versions[0].change, /\+4 words/);
  assert.equal(detail.versions[1].change, "First saved version");
  assert.match(detail.summary, /Asha approved it/);
  assert.match(detail.summary, /edited it 1 time/);
});

test("describeReview copes with a bare review", () => {
  const detail = describeReview({});
  assert.equal(detail.type, "Content review");
  assert.equal(detail.status, "Draft");
  assert.equal(detail.versions.length, 1);
  assert.match(detail.summary, /no issues/);
});
